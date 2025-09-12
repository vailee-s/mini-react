import { describe, it, expect } from 'vitest';
import {
  scheduleCallback,
  NormalPriority,
  UserBlockingPriority,
  ImmediatePriority,
} from '../src/Scheduler';

describe('任务', () => {
  it('2个相同优先级的任务', () => {
    let eventTasks: Array<any> = [];

    scheduleCallback(NormalPriority, (): any => {
      eventTasks.push('Task1');

      expect(eventTasks).toEqual(['Task1']);
    });

    scheduleCallback(NormalPriority, (): any => {
      eventTasks.push('Task2');
      expect(eventTasks).toEqual(['Task1', 'Task2']);
    });
  });

  it('3个不同优先级的任务', () => {
    let eventTasks: Array<any> = [];

    scheduleCallback(NormalPriority, (): any => {
      eventTasks.push('Task1');
      expect(eventTasks).toEqual(['Task3', 'Task2', 'Task1']);
    });

    scheduleCallback(UserBlockingPriority, (): any => {
      eventTasks.push('Task2');
      expect(eventTasks).toEqual(['Task3', 'Task2']);
    });

    scheduleCallback(ImmediatePriority, (): any => {
      eventTasks.push('Task3');
      expect(eventTasks).toEqual(['Task3']);
    });
  });

  it('4个不同优先级的任务', () => {
    let eventTasks: Array<any> = [];

    scheduleCallback(NormalPriority, (): any => {
      eventTasks.push('Task1');
      expect(eventTasks).toEqual(['Task3', 'Task2', 'Task1']);
    });

    scheduleCallback(UserBlockingPriority, (): any => {
      eventTasks.push('Task2');
      expect(eventTasks).toEqual(['Task3', 'Task2']);
    });

    scheduleCallback(ImmediatePriority, (): any => {
      eventTasks.push('Task3');
      expect(eventTasks).toEqual(['Task3']);
    });

    scheduleCallback(NormalPriority, (): any => {
      eventTasks.push('Task4');

      expect(eventTasks).toEqual(['Task3', 'Task2', 'Task1', 'Task4']);
    });
  });
});
