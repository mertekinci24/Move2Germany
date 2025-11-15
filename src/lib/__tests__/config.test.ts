import { describe, it, expect } from 'vitest';
import { configLoader } from '../config';

describe('ConfigLoader', () => {
  describe('getCities', () => {
    it('should return all 5 cities', () => {
      const cities = configLoader.getCities();
      expect(cities).toHaveLength(5);
      expect(cities.map(c => c.id)).toContain('aachen');
      expect(cities.map(c => c.id)).toContain('berlin');
      expect(cities.map(c => c.id)).toContain('munich');
      expect(cities.map(c => c.id)).toContain('frankfurt');
      expect(cities.map(c => c.id)).toContain('hamburg');
    });
  });

  describe('getModules', () => {
    it('should return all 4 modules', () => {
      const modules = configLoader.getModules();
      expect(modules).toHaveLength(4);
      expect(modules.map(m => m.id)).toContain('housing');
      expect(modules.map(m => m.id)).toContain('bureaucracy');
      expect(modules.map(m => m.id)).toContain('work');
      expect(modules.map(m => m.id)).toContain('social');
    });
  });

  describe('getTimeWindows', () => {
    it('should return all 5 time windows', () => {
      const timeWindows = configLoader.getTimeWindows();
      expect(timeWindows).toHaveLength(5);
      expect(timeWindows.map(tw => tw.id)).toContain('pre_arrival');
      expect(timeWindows.map(tw => tw.id)).toContain('week_1');
      expect(timeWindows.map(tw => tw.id)).toContain('weeks_2_4');
      expect(timeWindows.map(tw => tw.id)).toContain('month_2');
      expect(timeWindows.map(tw => tw.id)).toContain('month_3');
    });
  });

  describe('filterTasks', () => {
    it('should filter tasks by cityId', () => {
      const tasks = configLoader.filterTasks({ cityId: 'berlin' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.cityScope).toContain('berlin');
      });
    });

    it('should filter tasks by moduleId', () => {
      const tasks = configLoader.filterTasks({ moduleId: 'housing' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.module).toBe('housing');
      });
    });

    it('should filter tasks by timeWindowId', () => {
      const tasks = configLoader.filterTasks({ timeWindowId: 'week_1' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.timeWindow).toBe('week_1');
      });
    });

    it('should filter tasks by importance', () => {
      const tasks = configLoader.filterTasks({ importance: 'critical' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        expect(task.importance).toBe('critical');
      });
    });

    it('should filter tasks by search term', () => {
      const tasks = configLoader.filterTasks({ search: 'anmeldung' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach(task => {
        const searchMatch =
          task.title.toLowerCase().includes('anmeldung') ||
          task.description.toLowerCase().includes('anmeldung');
        expect(searchMatch).toBe(true);
      });
    });

    it('should combine multiple filters', () => {
      const tasks = configLoader.filterTasks({
        cityId: 'berlin',
        moduleId: 'bureaucracy',
        timeWindowId: 'week_1'
      });

      tasks.forEach(task => {
        expect(task.cityScope).toContain('berlin');
        expect(task.module).toBe('bureaucracy');
        expect(task.timeWindow).toBe('week_1');
      });
    });
  });

  describe('getTaskDependencies', () => {
    it('should return empty array for tasks with no dependencies', () => {
      const allTasks = configLoader.getTasks();
      const taskWithNoDeps = allTasks.find(t => t.dependencies.length === 0);

      if (taskWithNoDeps) {
        const deps = configLoader.getTaskDependencies(taskWithNoDeps.id);
        expect(deps).toHaveLength(0);
      }
    });

    it('should return dependency tasks for tasks with dependencies', () => {
      const allTasks = configLoader.getTasks();
      const taskWithDeps = allTasks.find(t => t.dependencies.length > 0);

      if (taskWithDeps) {
        const deps = configLoader.getTaskDependencies(taskWithDeps.id);
        expect(deps.length).toBe(taskWithDeps.dependencies.length);

        deps.forEach(dep => {
          expect(taskWithDeps.dependencies).toContain(dep.id);
        });
      }
    });
  });

  describe('getTask', () => {
    it('should return a task by id', () => {
      const allTasks = configLoader.getTasks();
      expect(allTasks.length).toBeGreaterThan(0);

      const firstTask = allTasks[0];
      const task = configLoader.getTask(firstTask.id);

      expect(task).toBeDefined();
      expect(task?.id).toBe(firstTask.id);
    });

    it('should return undefined for non-existent task', () => {
      const task = configLoader.getTask('non-existent-task-id');
      expect(task).toBeUndefined();
    });
  });
});
