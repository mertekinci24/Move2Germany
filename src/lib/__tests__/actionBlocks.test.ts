import { describe, it, expect } from 'vitest';
import { configLoader } from '../config';

describe('Action Blocks', () => {
  it('should load action blocks for configured tasks', () => {
    const anmeldungTask = configLoader.getTask('anmeldung-yaptir');

    expect(anmeldungTask).toBeDefined();
    expect(anmeldungTask?.actionLinks).toBeDefined();
    expect(anmeldungTask?.actionLinks?.length).toBeGreaterThan(0);
    expect(anmeldungTask?.documentChecklist).toBeDefined();
  });

  it('should filter links by city scope', () => {
    const anmeldungTask = configLoader.getTask('anmeldung-yaptir');

    const berlinLinks = anmeldungTask?.actionLinks?.filter(link => {
      if (!link.cityScope || link.cityScope.length === 0) return true;
      return link.cityScope.includes('berlin');
    });

    const berlinSpecificLinks = anmeldungTask?.actionLinks?.filter(link =>
      link.cityScope?.includes('berlin')
    );

    expect(berlinLinks).toBeDefined();
    expect(berlinSpecificLinks?.length).toBeGreaterThan(0);
  });

  it('should have templates for housing task', () => {
    const housingTask = configLoader.getTask('kira-oda-ilanlarini-takip-et');

    expect(housingTask).toBeDefined();
    expect(housingTask?.templates).toBeDefined();
    expect(housingTask?.templates?.length).toBeGreaterThan(0);

    const landlordTemplate = housingTask?.templates?.find(t =>
      t.aiPromptKey === 'housing_landlord_intro'
    );
    expect(landlordTemplate).toBeDefined();
  });

  it('should have document checklist for health insurance', () => {
    const healthTask = configLoader.getTask('saglik-sigortasi-sec-ve-kayit-ol');

    expect(healthTask).toBeDefined();
    expect(healthTask?.documentChecklist).toBeDefined();
    expect(healthTask?.documentChecklist?.length).toBeGreaterThan(0);

    const passportDoc = healthTask?.documentChecklist?.find(d =>
      d.id === 'passport'
    );
    expect(passportDoc).toBeDefined();
  });

  it('should categorize links by type', () => {
    const healthTask = configLoader.getTask('saglik-sigortasi-sec-ve-kayit-ol');

    const officialLinks = healthTask?.actionLinks?.filter(l => l.type === 'official');
    const toolLinks = healthTask?.actionLinks?.filter(l => l.type === 'tool');
    const infoLinks = healthTask?.actionLinks?.filter(l => l.type === 'info');

    expect(officialLinks || toolLinks || infoLinks).toBeDefined();
    expect((healthTask?.actionLinks?.length || 0)).toBeGreaterThan(0);
  });

  it('should load job application task with templates', () => {
    const jobTask = configLoader.getTask('ilk-is-basvurularini-yap');

    expect(jobTask).toBeDefined();
    expect(jobTask?.actionLinks).toBeDefined();
    expect(jobTask?.templates).toBeDefined();
    expect(jobTask?.documentChecklist).toBeDefined();

    const jobTemplates = jobTask?.templates?.filter(t =>
      t.purpose === 'job'
    );
    expect(jobTemplates?.length).toBeGreaterThan(0);
  });

  it('should handle tasks without action blocks', () => {
    const tasks = configLoader.getTasks();
    const tasksWithoutBlocks = tasks.filter(t =>
      !t.actionLinks && !t.templates && !t.documentChecklist
    );

    expect(tasksWithoutBlocks.length).toBeGreaterThan(0);
  });
});
