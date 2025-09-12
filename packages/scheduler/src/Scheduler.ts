// !实现一个单线程的任务调度器
import { getCurrentTime, isFn } from "shared/utils";
import {
  PriorityLevel,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  NoPriority,
} from "./SchedulerPriorities";
import { peek, pop, push } from "./SchedulerMinHeap";
import {
  lowPriorityTimeout,
  maxSigned31BitInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";
type Callback = (arg: boolean) => Callback | null | undefined;
export type Task = {
  id: number;
  callback: Callback | null;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
  sortIndex: number;
};
let taskIdCounter = 1; // 任务id计数器
// 任务池 -》 最小堆数据结构
const taskQueue: Array<Task> = [];
let currentTask: Task | null = null; // 当前正在执行的任务
let currentPriorityLevel: PriorityLevel = NoPriority; // 当前正在执行的任务
// 记录时间切片的起始值，时间戳
let startTime = -1;

// 时间切片，这是个时间段
let frameInterval = 5;

// 锁,是否有 work 在执行
let isPerformingWork = false;
// 记录是否有任务在调度
let isHostCallbackScheduled = false;
// 记录是否有消息循环在运行
let isMessageLoopRunning = false;

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    // 记录时间切片的起始值
    const currentTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      hasMoreWork = flushWork(currentTime);
      if (!hasMoreWork) {
        isMessageLoopRunning = false;
      } else {
        schedulePerformWorkUntilDeadline();
      }
    } catch (error) {}
  }
}

function flushWork(initialTime: number): boolean {
  isHostCallbackScheduled = false;
  isPerformingWork = true;
  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

function getTimeoutForPriority(priorityLevel: PriorityLevel) {
  switch (priorityLevel) {
    // 立即执行
    case ImmediatePriority:
      return -1;
    // 用户阻塞
    case UserBlockingPriority:
      return userBlockingPriorityTimeout;
    // 低优先级
    case LowPriority:
      return lowPriorityTimeout;
    // 空闲时间
    case IdlePriority:
      return maxSigned31BitInt;
    // 普通
    case NormalPriority:
    default:
      return normalPriorityTimeout;
  }
}
// 任务调度器入口函数
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  const startTime = getCurrentTime();
  // 任务过期时间
  const timeout = getTimeoutForPriority(priorityLevel);
  const expirationTime = startTime + timeout;
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  newTask.sortIndex = expirationTime;
  // 将任务添加到任务池中
  push(taskQueue, newTask);
  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback();
  }
}

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

// 取消任务,由于任务池是最小堆结构，取消任务比较复杂，这里不实现，只能初步把task.callback设为null,在调度过程中，当这个任务位于堆顶时，弹出堆顶
function cancelCallback() {
  currentTask!.callback = null;
}

// 获取当前任务的优先级
function getCurrentPriorityLevel(): PriorityLevel {
  // return currentTask ? currentTask.priorityLevel : NormalPriority;
  // return currentTask?.priorityLevel ?? NormalPriority;
  return currentPriorityLevel!;
}
// 判断是否需要让出时间片给浏览器
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;

  if (timeElapsed < frameInterval) {
    return false;
  }

  return true;
}
// 一个work内有一个或多个task，每个task有一个callback，callback执行完后，继续下一个callback

function workLoop(initialTime: number): boolean {
  let currentTime = initialTime;
  currentTask = peek(taskQueue);
  // 执行任务
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === "function") {
        // 任务没有执行完毕，继续添加到任务池中
        currentTask.callback = continuationCallback;
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          // 任务执行完毕，从任务池中移除
          pop(taskQueue);
        }
      }
    } else {
      // 任务执行完毕，从任务池中移除
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  } else {
    return false;
  }
}
export {
  ImmediatePriority,
  UserBlockingPriority,
  NoPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  scheduleCallback,
  cancelCallback,
  getCurrentPriorityLevel,
  shouldYieldToHost,
};
