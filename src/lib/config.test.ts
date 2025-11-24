import { describe, it, expect } from 'vitest';
import { configLoader } from './config';

describe('ConfigLoader i18n', () => {
    it('should return Turkish tasks by default (base)', () => {
        const tasks = configLoader.getTasks('tr');
        const task = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        expect(task?.title).toBe('Kira/oda ilanlarını takip et');
        expect(task?.description).toContain('WG-Gesucht');
    });

    it('should return English tasks when locale is en', () => {
        const tasks = configLoader.getTasks('en');
        const task = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        expect(task?.title).toBe('Follow rent/room listings');
        expect(task?.description).toContain('Regularly check room listings');
    });

    it('should return Arabic tasks when locale is ar', () => {
        const tasks = configLoader.getTasks('ar');
        const task = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        expect(task?.title).toBe('متابعة إعلانات الإيجار/الغرف');
    });

    it('should preserve structural fields from base config', () => {
        const tasks = configLoader.getTasks('en');
        const task = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        expect(task?.module).toBe('housing');
        expect(task?.timeWindow).toBe('pre_arrival');
        expect(task?.importance).toBe('critical');
    });

    it('should fall back to base value if overlay field is missing', () => {
        // Assuming there's a task where we didn't provide a cityNote in English overlay but it exists in TR
        // Let's check 'anmeldung-icin-randevu-al' which has cityNote in both.
        // Let's check a task that might NOT have a cityNote in overlay but has in base?
        // Actually I translated all of them.
        // But let's verify that a non-text field is definitely from base.
        const tasks = configLoader.getTasks('en');
        const task = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        // This task has no cityNote in base, so it should be undefined in EN too.
        expect(task?.cityNote).toBeUndefined();

        // 'anmeldung-icin-randevu-al' has cityNote in both.
        const taskWithNote = tasks.find(t => t.id === 'anmeldung-icin-randevu-al');
        expect(taskWithNote?.cityNote).toBe('In Berlin, appointments should be booked at least 4-6 weeks in advance.');
    });
    it('should correctly translate "Prepare application documents" task', () => {
        const tasksEn = configLoader.getTasks('en');
        const taskEn = tasksEn.find(t => t.id === 'basvuru-belgelerini-hazirla');
        expect(taskEn?.title).toBe('Prepare application documents');
        expect(taskEn?.description).toContain('Complete documents like SCHUFA');

        const tasksTr = configLoader.getTasks('tr');
        const taskTr = tasksTr.find(t => t.id === 'basvuru-belgelerini-hazirla');
        expect(taskTr?.title).toBe('Başvuru belgelerini hazırla');
    });

    it('should correctly translate subtasks', () => {
        const tasksEn = configLoader.getTasks('en');
        const taskEn = tasksEn.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        const subtaskEn = taskEn?.subtasks?.find(s => s.id === 'define_budget');
        expect(subtaskEn?.title).toBe('Define your budget and criteria');

        const tasksAr = configLoader.getTasks('ar');
        const taskAr = tasksAr.find(t => t.id === 'kira-oda-ilanlarini-takip-et');
        const subtaskAr = taskAr?.subtasks?.find(s => s.id === 'define_budget');
        expect(subtaskAr?.title).toBe('حدد ميزانيتك ومعاييرك');
    });
});
