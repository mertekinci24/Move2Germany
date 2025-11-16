import { useState, useEffect } from 'react';
import { ExternalLink, FileText, Sparkles, Check, Copy } from 'lucide-react';
import { Task, TaskActionLink } from '../../lib/config';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserTaskDocuments, toggleTaskDocument, UserTaskDocument } from '../../lib/documents';
import { designTokens } from '../../lib/design-tokens';
import { generateAIResponse } from '../../lib/ai';

type ActionBlockProps = {
  task: Task;
  userCity?: string;
};

export function ActionBlock({ task, userCity }: ActionBlockProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generatingTemplate, setGeneratingTemplate] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasActionBlocks =
    (task.actionLinks && task.actionLinks.length > 0) ||
    (task.templates && task.templates.length > 0) ||
    (task.documentChecklist && task.documentChecklist.length > 0);

  useEffect(() => {
    if (user && task.documentChecklist) {
      loadCheckedDocuments();
    } else {
      setLoading(false);
    }
  }, [user, task.id]);

  async function loadCheckedDocuments() {
    if (!user) return;

    try {
      const docs = await getUserTaskDocuments(user.id, task.id);
      const checked = new Set(docs.filter(d => d.isChecked).map(d => d.documentId));
      setCheckedDocs(checked);
    } catch (error) {
      console.error('Failed to load checked documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDocument(documentId: string) {
    if (!user) return;

    const newChecked = !checkedDocs.has(documentId);

    try {
      await toggleTaskDocument(user.id, task.id, documentId, newChecked);

      setCheckedDocs(prev => {
        const next = new Set(prev);
        if (newChecked) {
          next.add(documentId);
        } else {
          next.delete(documentId);
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to toggle document:', error);
    }
  }

  async function handleGenerateTemplate(templateId: string, promptKey: string) {
    setGeneratingTemplate(templateId);
    setGeneratedText(null);
    setCopied(false);

    try {
      const prompt = getTemplatePrompt(promptKey);
      const response = await generateAIResponse(prompt);
      setGeneratedText(response);
    } catch (error) {
      console.error('Failed to generate template:', error);
      setGeneratedText('Failed to generate template. Please try again.');
    } finally {
      setGeneratingTemplate(null);
    }
  }

  function getTemplatePrompt(promptKey: string): string {
    const prompts: Record<string, string> = {
      housing_landlord_intro: `Generate a professional German message (in both German and English) to introduce yourself to a potential landlord or flatmate. Include: name, occupation/student status, move-in date, and why you're interested in the apartment. Keep it friendly and concise (150-200 words).`,
      job_application_email: `Create a professional job application email in German with English translation. Include: greeting, brief introduction, mention of the position, key qualifications (1-2 sentences), request for interview, and professional closing. Format: 200-250 words.`,
      job_cv_german_format: `Provide guidance on creating a German-style CV (Lebenslauf). Include: essential sections (personal data, education, work experience, skills), formatting tips, what to include/exclude, and key differences from US/UK CVs. Keep practical and concise.`,
      social_group_intro: `Write a friendly introduction message for joining an expat or social group in Germany. Include: brief self-introduction, interests, reason for moving to Germany, and desire to meet new people. Tone should be warm and approachable (100-150 words).`,
    };

    return prompts[promptKey] || `Generate a helpful template for: ${promptKey}`;
  }

  function filterLinksByCity(links: TaskActionLink[]): TaskActionLink[] {
    if (!userCity) return links;

    return links.filter(link => {
      if (!link.cityScope || link.cityScope.length === 0) return true;
      return link.cityScope.includes(userCity);
    });
  }

  async function handleCopyToClipboard() {
    if (!generatedText) return;

    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  if (!hasActionBlocks) {
    return null;
  }

  const officialLinks = task.actionLinks?.filter(l => l.type === 'official') || [];
  const toolLinks = task.actionLinks?.filter(l => l.type === 'tool' || l.type === 'community' || l.type === 'info') || [];
  const filteredOfficialLinks = filterLinksByCity(officialLinks);
  const filteredToolLinks = filterLinksByCity(toolLinks);

  return (
    <div
      className="mt-6 p-6 bg-white rounded-lg border border-gray-200"
      style={{
        borderRadius: designTokens.radius.lg,
        boxShadow: designTokens.shadows.md,
      }}
    >
      <h3
        className="text-xl font-semibold text-gray-900 mb-4"
        style={{
          fontSize: designTokens.typography.fontSize.xl,
          fontWeight: designTokens.typography.fontWeight.semibold,
        }}
      >
        {t('actionBlock.title')}
      </h3>

      <div className="space-y-6">
        {filteredOfficialLinks.length > 0 && (
          <div>
            <h4
              className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2"
              style={{ fontSize: designTokens.typography.fontSize.base }}
            >
              <ExternalLink className="w-5 h-5" />
              {t('actionBlock.officialLinks')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredOfficialLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  style={{
                    borderRadius: designTokens.radius.md,
                    backgroundColor: designTokens.colors.primary[50],
                    color: designTokens.colors.primary[700],
                  }}
                >
                  {link.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        )}

        {filteredToolLinks.length > 0 && (
          <div>
            <h4
              className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2"
              style={{ fontSize: designTokens.typography.fontSize.base }}
            >
              <ExternalLink className="w-5 h-5" />
              {t('actionBlock.suggestedPlatforms')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredToolLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{
                    borderRadius: designTokens.radius.md,
                  }}
                >
                  {link.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        )}

        {task.documentChecklist && task.documentChecklist.length > 0 && (
          <div>
            <h4
              className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2"
              style={{ fontSize: designTokens.typography.fontSize.base }}
            >
              <FileText className="w-5 h-5" />
              {t('actionBlock.requiredDocuments')}
            </h4>
            <div className="space-y-2">
              {task.documentChecklist.map(doc => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{ borderRadius: designTokens.radius.md }}
                >
                  <input
                    type="checkbox"
                    checked={checkedDocs.has(doc.id)}
                    onChange={() => handleToggleDocument(doc.id)}
                    disabled={loading}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-gray-700">
                    {doc.label}
                    {doc.optional && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({t('actionBlock.optional')})
                      </span>
                    )}
                  </span>
                  {checkedDocs.has(doc.id) && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {task.templates && task.templates.length > 0 && (
          <div>
            <h4
              className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2"
              style={{ fontSize: designTokens.typography.fontSize.base }}
            >
              <Sparkles className="w-5 h-5" />
              {t('actionBlock.aiTemplates')}
            </h4>
            <div className="space-y-3">
              {task.templates.map(template => (
                <div key={template.id}>
                  <button
                    onClick={() => handleGenerateTemplate(template.id, template.aiPromptKey)}
                    disabled={generatingTemplate === template.id}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      borderRadius: designTokens.radius.md,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    {generatingTemplate === template.id ? t('actionBlock.generating') : template.label}
                  </button>
                </div>
              ))}

              {generatedText && (
                <div
                  className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  style={{ borderRadius: designTokens.radius.md }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Generated Template:</span>
                    <button
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: designTokens.radius.sm }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          {t('actionBlock.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {t('actionBlock.copyTemplate')}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                      {generatedText}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
