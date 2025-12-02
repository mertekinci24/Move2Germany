import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import { configLoader } from './config';
import { getUserTask, updateUserTask, getTasksWithStatus } from './tasks';
import { logAuditEvent } from './auth';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY is not set');
}
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

export type AiContext = {
  userId: string;
  cityId?: string;
  timeWindowId?: string;
  route?: string;
  taskId?: string;
  locale?: string;
};

export type AiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};


const SYSTEM_PROMPT = `You are a helpful assistant for Move2Germany, a platform that helps international students and expats navigate their first 90 days in Germany.

**IMPORTANT CONSTRAINTS:**
- You provide ONLY general information and links to official resources
- You NEVER provide personalized legal, tax, or financial advice
- You MUST always include this disclaimer when discussing bureaucratic matters: "This is general information only and not legal advice. Please consult official authorities and professional advisors."
- You help users understand their tasks, but don't make decisions for them
- You can explain processes, provide links, and simplify complex topics

**Available Tools:**
1. listTasks(filter) - List tasks based on filters
2. explainTask(taskId) - Explain a specific task in detail
3. updateTaskStatus(taskId, status) - Update a task's status (todo/in_progress/done/blocked)
4. openContent(contentKey) - Get information from knowledge base

**Context you have access to:**
- User's selected city and time window
- Current page/route they're on
- Specific task if they're viewing one
- Their task completion status

Be concise, friendly, and helpful. Use simple language suitable for non-native speakers.`;

export async function sendMessage(
  message: string,
  context: AiContext,
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  let convId: string;

  if (!conversationId) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: context.userId })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create conversation');
    }

    convId = data.id;
  } else {
    convId = conversationId;
  }

  await supabase
    .from('ai_messages')
    .insert({
      conversation_id: convId,
      role: 'user',
      content: message
    });

  const history = await getConversationHistory(convId);

  const contextInfo = await buildContextInfo(context);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    systemInstruction: SYSTEM_PROMPT
  });

  // MOCK MODE: If API key is dummy or missing, return a mock response
  if (!apiKey || apiKey === 'dummy-key') {
    console.warn('Using Mock AI Response');
    const mockResponse = "This is a mock response from the AI Assistant. The API key is missing, but the chat functionality is working. You asked: " + message;

    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: convId,
        role: 'assistant',
        content: mockResponse
      });

    return { response: mockResponse, conversationId: convId };
  }

  const chat = model.startChat({
    history: history.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
  });

  const prompt = `${contextInfo}\n\nUser: ${message}`;

  let result = await chat.sendMessage(prompt);
  let response = result.response.text();

  const toolCallMatch = response.match(/\[TOOL:(\w+)\((.*?)\)\]/);
  if (toolCallMatch) {
    const toolName = toolCallMatch[1];
    const argsStr = toolCallMatch[2];

    let toolResult;
    try {
      toolResult = await executeTool(toolName, argsStr, context);
      const toolPrompt = `Tool result from ${toolName}: ${JSON.stringify(toolResult)}`;
      result = await chat.sendMessage(toolPrompt);
      response = result.response.text();
    } catch (error) {
      response = `I tried to ${toolName} but encountered an error. ${(error as Error).message}`;
    }
  }

  await supabase
    .from('ai_messages')
    .insert({
      conversation_id: convId,
      role: 'assistant',
      content: response
    });

  await logAuditEvent(context.userId, 'ai_call', {
    conversationId: convId,
    messageLength: message.length
  });

  return { response, conversationId: convId };
}

async function buildContextInfo(context: AiContext): Promise<string> {
  const parts: string[] = ['**Current Context:**'];

  if (context.cityId) {
    const city = configLoader.getCity(context.cityId);
    parts.push(`- City: ${city?.name || context.cityId}`);
  }

  if (context.timeWindowId) {
    const timeWindow = configLoader.getTimeWindow(context.timeWindowId);
    parts.push(`- Time Window: ${timeWindow?.label || context.timeWindowId}`);
  }

  if (context.route) {
    parts.push(`- Current Page: ${context.route}`);
  }

  if (context.taskId) {
    const task = configLoader.getTask(context.taskId);
    if (task) {
      parts.push(`- Viewing Task: ${task.title}`);
      const userTask = await getUserTask(context.userId, context.taskId);
      if (userTask) {
        parts.push(`  - Status: ${userTask.status}`);
        if (userTask.notes) {
          parts.push(`  - User Notes: ${userTask.notes}`);
        }
      }
    }
  }

  return parts.join('\n');
}

async function executeTool(toolName: string, argsStr: string, context: AiContext): Promise<Record<string, unknown>> {
  const args = parseToolArgs(argsStr);

  switch (toolName) {
    case 'listTasks':
      return await listTasksTool(args, context);
    case 'explainTask':
      return await explainTaskTool(args, context);
    case 'updateTaskStatus':
      return await updateTaskStatusTool(args, context);
    case 'openContent':
      return await openContentTool(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

function parseToolArgs(argsStr: string): Record<string, unknown> {
  if (!argsStr.trim()) {
    return {};
  }

  try {
    return JSON.parse(`{${argsStr}}`);
  } catch {
    return {};
  }
}

async function listTasksTool(args: Record<string, unknown>, context: AiContext): Promise<Record<string, unknown>> {
  const tasks = await getTasksWithStatus(context.userId, {
    cityId: (args.cityId as string) || context.cityId,
    timeWindowId: (args.timeWindowId as string) || context.timeWindowId,
    moduleId: args.moduleId as string,
    importance: args.importance as any,
    locale: context.locale
  });

  const taskList = tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    importance: t.importance,
    status: t.userTask?.status || 'not_started'
  }));

  return { tasks: taskList };
}

async function explainTaskTool(args: Record<string, unknown>, context: AiContext): Promise<Record<string, unknown>> {
  const task = configLoader.getTask(args.taskId as string);

  if (!task) {
    throw new Error('Task not found');
  }

  const dependencies = configLoader.getTaskDependencies(args.taskId as string);
  const userTask = await getUserTask(context.userId, args.taskId as string);

  return {
    title: task.title,
    description: task.description,
    module: task.module,
    timeWindow: task.timeWindow,
    importance: task.importance,
    dependencies: dependencies.map(d => d.title),
    status: userTask?.status || 'not_started',
    cityNote: task.cityNote
  };
}

async function updateTaskStatusTool(args: Record<string, unknown>, context: AiContext): Promise<Record<string, unknown>> {
  const validStatuses = ['todo', 'in_progress', 'done', 'blocked'];

  if (!validStatuses.includes(args.status as string)) {
    throw new Error('Invalid status');
  }

  const userTask = await updateUserTask(context.userId, args.taskId as string, {
    status: args.status as any
  });

  return {
    taskId: userTask.taskId,
    status: userTask.status,
    message: 'Task status updated successfully'
  };
}

async function openContentTool(args: Record<string, unknown>): Promise<Record<string, string>> {
  const contentMap: Record<string, string> = {
    'anmeldung': 'Anmeldung (Resident Registration): You must register your address at the local registration office (Bürgeramt) within 14 days of moving. Required documents: passport, rental contract (Wohnungsgeberbestätigung), and completed registration form. Link: https://www.berlin.de/buergeramt/',
    'health_insurance': 'Health Insurance: Mandatory for all residents. Students can get public insurance (€110-120/month) or private insurance. Must show proof for university enrollment. Popular providers: TK, AOK, DAK. Link: https://www.tk.de',
    'minijob': 'Minijob: Part-time job up to €520/month. Students can work 20h/week during semester, full-time during breaks. Need tax ID and work permit. Link: https://www.minijob-zentrale.de',
    'housing_scams': 'Housing Scams: Never pay deposit before seeing apartment. Verify landlord identity. Use official platforms like WG-Gesucht. Avoid wire transfers to foreign accounts. Report suspicious listings.',
    'loneliness': 'Dealing with Loneliness: Join student clubs, attend Meetup events, use Tandem apps for language exchange. Universities offer buddy programs. Berlin has many international communities.'
  };

  const content = contentMap[args.contentKey as string];

  if (!content) {
    return { message: 'Content not found for that topic' };
  }

  return { content };
}

async function getConversationHistory(conversationId: string): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content
  }));
}

export async function endConversation(conversationId: string): Promise<void> {
  await supabase
    .from('ai_conversations')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', conversationId);
}

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!apiKey || apiKey === 'dummy-key') {
    return 'AI generation is not available. Please configure VITE_GEMINI_API_KEY.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate AI response');
  }
}
