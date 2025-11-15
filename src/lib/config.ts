import tasksConfig from '../../config/move2germany_tasks_v1.json';
import actionBlocksConfig from '../../config/action_blocks_v1.json';

export type City = {
  id: string;
  name: string;
};

export type TimeWindow = {
  id: 'pre_arrival' | 'week_1' | 'weeks_2_4' | 'month_2' | 'month_3';
  label: string;
};

export type Module = {
  id: 'housing' | 'bureaucracy' | 'work' | 'social';
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

export type TaskDocumentChecklistItem = {
  id: string;
  label: string;
  optional?: boolean;
};

export type Task = {
  id: string;
  timeWindow: TimeWindow['id'];
  module: Module['id'];
  title: string;
  description: string;
  dependencies: string[];
  importance: 'critical' | 'high' | 'medium';
  repeat: 'once' | 'recurring';
  cityScope: string[];
  cityNote?: string;
  contentKey?: string;
  actionLinks?: TaskActionLink[];
  templates?: TaskTemplate[];
  documentChecklist?: TaskDocumentChecklistItem[];
};

export type Config = {
  cities: City[];
  timeWindows: TimeWindow[];
  modules: Module[];
  tasks: Task[];
};

class ConfigLoader {
  private config: Config;

  constructor() {
    this.config = tasksConfig as Config;
  }

  getCities(): City[] {
    return this.config.cities;
  }

  getCity(cityId: string): City | undefined {
    return this.config.cities.find(c => c.id === cityId);
  }

  getTimeWindows(): TimeWindow[] {
    return this.config.timeWindows;
  }

  getTimeWindow(timeWindowId: string): TimeWindow | undefined {
    return this.config.timeWindows.find(tw => tw.id === timeWindowId);
  }

  getModules(): Module[] {
    return this.config.modules;
  }

  getModule(moduleId: string): Module | undefined {
    return this.config.modules.find(m => m.id === moduleId);
  }

  getTasks(): Task[] {
    return this.config.tasks;
  }

  getTask(taskId: string): Task | undefined {
    const task = this.config.tasks.find(t => t.id === taskId);
    if (!task) return undefined;

    const actionBlock = (actionBlocksConfig as any).actionBlocks[taskId];
    if (actionBlock) {
      return {
        ...task,
        actionLinks: actionBlock.actionLinks,
        templates: actionBlock.templates,
        documentChecklist: actionBlock.documentChecklist,
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
  }): Task[] {
    let filtered = this.config.tasks;

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

    return filtered;
  }

  getTaskDependencies(taskId: string): Task[] {
    const task = this.getTask(taskId);
    if (!task || !task.dependencies.length) {
      return [];
    }

    return task.dependencies
      .map(depId => this.getTask(depId))
      .filter((t): t is Task => t !== undefined);
  }

  getDependentTasks(taskId: string): Task[] {
    return this.config.tasks.filter(task =>
      task.dependencies.includes(taskId)
    );
  }
}

export const configLoader = new ConfigLoader();
