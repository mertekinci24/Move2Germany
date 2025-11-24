import tasksConfig from '../../config/move2germany_tasks_v1.json';
import tasksConfigEn from '../../config/move2germany_tasks_en_v1.json';
import tasksConfigAr from '../../config/move2germany_tasks_ar_v1.json';
import actionBlocksConfig from '../../config/action_blocks_v1.json';
import housingProvidersConfig from '../../config/housing_providers.json';
import journeyPhasesConfig from '../config/journey_phases_v1.json';

export type City = {
  id: string;
  name: string;
};

export type TimeWindow = {
  id: string;
  label: string;
};

export type JourneyPhase = {
  id: string;
  order: number;
  minDaysFromArrival: number;
  maxDaysFromArrival: number | null;
  labelKey: string;
};

export type Module = {
  id: string;
  label: string;
};

export type TaskActionLink = {
  id: string;
  label: string;
  url: string;
  cityScope?: string[];
  type: 'official' | 'tool' | 'community' | 'info';
};

export type TaskTemplate = {
  id: string;
  label: string;
  purpose: 'housing' | 'job' | 'bureaucracy' | 'social';
  aiPromptKey: string;
};


export type HousingProvider = {
  id: string;
  cityIds: string[];
  type: string;
  urlTemplate: string;
  labelKey: string;
  enabled: boolean;
};

export type Config = {
  cities: City[];
  timeWindows: TimeWindow[];
  modules: Module[];
  tasks: Task[];
  journeyPhases: JourneyPhase[];
};

export type SubtaskType = 'simple' | 'linked_task' | 'form_criteria' | 'external_action';

export type BaseSubtask = {
  id: string;
  title: string;
  required?: boolean;
  personas?: string[];
  type: SubtaskType;
};

export type SimpleSubtask = BaseSubtask & {
  type: 'simple';
};

export type LinkedTaskSubtask = BaseSubtask & {
  type: 'linked_task';
  linkedTaskId: string;
};

export type FormCriteriaSubtask = BaseSubtask & {
  type: 'form_criteria';
  criteriaKey: 'housing_preferences' | 'job_preferences';
  fields: string[];
};

export type ExternalActionSubtask = BaseSubtask & {
  type: 'external_action';
  actionType: 'housing_platform_signup';
  providers?: string[];
};

export type TaskSubtask = SimpleSubtask | LinkedTaskSubtask | FormCriteriaSubtask | ExternalActionSubtask;

export type Task = {
  id: string;
  title: string;
  description: string;
  module: 'housing' | 'job' | 'bureaucracy' | 'social';
  timeWindow: string;
  importance: 'critical' | 'recommended' | 'optional';
  cityScope: string[];
  dependencies: string[];
  subtasks?: TaskSubtask[];
  cityNote?: string;
  personas?: string[];

  // Enriched fields (from action blocks)
  actionLinks?: TaskActionLink[];
  templates?: TaskTemplate[];
  documentChecklist?: TaskDocumentChecklistItem[];
  housingProviders?: boolean;
};

export type TaskDocumentChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
};

type ActionBlocksConfig = {
  actionBlocks: Record<string, {
    actionLinks?: TaskActionLink[];
    templates?: TaskTemplate[];
    documentChecklist?: TaskDocumentChecklistItem[];
    housingProviders?: boolean;
  }>;
};
type TaskOverlay = {
  id: string;
  title?: string;
  description?: string;
  cityNote?: string;
  summary?: string;
  hint?: string;
  helperText?: string;
  subtasks?: {
    id: string;
    title: string;
  }[];
};

class ConfigLoader {
  private config: Config;
  private taskCache: Record<string, Task[]> = {};

  constructor() {
    this.config = {
      ...tasksConfig,
      journeyPhases: journeyPhasesConfig
    } as unknown as Config; // Cast needed because JSON might not fully match discriminated unions yet
  }

  getCities(): City[] {
    return this.config.cities;
  }

  getCity(cityId: string): City | undefined {
    return this.config.cities.find(c => c.id === cityId);
  }

  getTimeWindows(): TimeWindow[] {
    // Map journey phases to TimeWindow format for backward compatibility if needed,
    // or just return them if the UI is updated to use JourneyPhase.
    // For now, let's keep using the static timeWindows from config if they exist,
    // OR prefer the journey phases if we want to switch completely.
    // The requirement says "Move phase definitions into a single config place".
    // So we should expose journey phases.
    return this.config.journeyPhases.map(p => ({
      id: p.id,
      label: p.labelKey // Note: This is a key, UI needs to translate it.
    }));
  }

  getJourneyPhases(): JourneyPhase[] {
    return this.config.journeyPhases;
  }

  getTimeWindow(timeWindowId: string): TimeWindow | undefined {
    const phase = this.config.journeyPhases.find(p => p.id === timeWindowId);
    if (phase) {
      return {
        id: phase.id,
        label: phase.labelKey
      };
    }
    return this.config.timeWindows.find(tw => tw.id === timeWindowId);
  }

  getModules(): Module[] {
    return this.config.modules;
  }

  getModule(moduleId: string): Module | undefined {
    return this.config.modules.find(m => m.id === moduleId);
  }

  private getTasksForLocale(locale: string): Task[] {
    // Default to Turkish (base) if locale is 'tr' or unknown
    if (!locale || locale === 'tr') {
      return this.config.tasks;
    }

    // Return cached result if available
    if (this.taskCache[locale]) {
      return this.taskCache[locale];
    }

    // Select overlay based on locale
    let overlayTasks: TaskOverlay[] = [];
    if (locale === 'en') {
      overlayTasks = tasksConfigEn as TaskOverlay[];
    } else if (locale === 'ar') {
      overlayTasks = tasksConfigAr as TaskOverlay[];
    } else {
      return this.config.tasks;
    }

    // Create a map for faster lookup
    const overlayMap = new Map(overlayTasks.map(t => [t.id, t]));

    // Merge tasks
    const mergedTasks = this.config.tasks.map(baseTask => {
      const overlay = overlayMap.get(baseTask.id);
      if (!overlay) return baseTask;

      // Strict overlay: only allow specific text fields
      // Field-level fallback: use overlay value if present, otherwise keep base value
      return {
        ...baseTask,
        title: overlay.title || baseTask.title,
        description: overlay.description || baseTask.description,
        cityNote: overlay.cityNote || baseTask.cityNote,
        subtasks: baseTask.subtasks?.map(baseSubtask => {
          const overlaySubtask = overlay.subtasks?.find(s => s.id === baseSubtask.id);
          return {
            ...baseSubtask,
            title: overlaySubtask?.title || baseSubtask.title
          };
        })
        // Add other text fields if they exist in the future, but DO NOT overwrite structural fields
      };
    });

    // Cache and return
    this.taskCache[locale] = mergedTasks;
    return mergedTasks;
  }

  getTasks(locale: string = 'tr'): Task[] {
    return this.getTasksForLocale(locale);
  }

  getTask(taskId: string, locale: string = 'tr'): Task | undefined {
    const tasks = this.getTasksForLocale(locale);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return undefined;

    const actionBlock = (actionBlocksConfig as ActionBlocksConfig).actionBlocks[taskId];
    if (actionBlock) {
      return {
        ...task,
        actionLinks: actionBlock.actionLinks,
        templates: actionBlock.templates,
        documentChecklist: actionBlock.documentChecklist,
        housingProviders: actionBlock.housingProviders,
      };
    }

    return task;
  }

  filterTasks(filters: {
    cityId?: string;
    timeWindowId?: string;
    moduleId?: string;
    importance?: Task['importance'];
    search?: string;
    locale?: string;
    personaType?: string | null;
  }): Task[] {
    let filtered = this.getTasksForLocale(filters.locale || 'tr');

    if (filters.cityId) {
      filtered = filtered.filter(task =>
        task.cityScope.includes(filters.cityId!)
      );
    }

    if (filters.timeWindowId) {
      filtered = filtered.filter(task =>
        task.timeWindow === filters.timeWindowId
      );
    }

    if (filters.moduleId) {
      filtered = filtered.filter(task =>
        task.module === filters.moduleId
      );
    }

    if (filters.importance) {
      filtered = filtered.filter(task =>
        task.importance === filters.importance
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.personaType) {
      filtered = filtered.filter(task => {
        // If task has no specific personas, it's for everyone
        if (!task.personas || task.personas.length === 0) return true;
        // Otherwise, user's persona must be in the list
        return task.personas.includes(filters.personaType!);
      });
    }

    return filtered;
  }


  getTaskDependencies(taskId: string, locale: string = 'tr'): Task[] {
    const task = this.getTask(taskId, locale);
    if (!task || !task.dependencies.length) {
      return [];
    }

    return task.dependencies
      .map(depId => this.getTask(depId, locale))
      .filter((t): t is Task => t !== undefined);
  }

  getDependentTasks(taskId: string, locale: string = 'tr'): Task[] {
    const tasks = this.getTasksForLocale(locale);
    return tasks.filter(task =>
      task.dependencies.includes(taskId)
    );
  }
}

export const configLoader = new ConfigLoader();
export const housingProviders: HousingProvider[] = housingProvidersConfig;
