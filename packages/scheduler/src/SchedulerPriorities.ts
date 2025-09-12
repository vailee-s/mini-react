export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const NoPriority: PriorityLevel = 0; // 节点优先级最高
export const ImmediatePriority: PriorityLevel = 1; // 立即优先级
export const UserBlockingPriority: PriorityLevel = 2; // 用户阻塞优先级
export const NormalPriority: PriorityLevel = 3; // 普通优先级
export const LowPriority: PriorityLevel = 4; // 低优先级
export const IdlePriority: PriorityLevel = 5; // 空闲优先级

export const NoWork = 0; // 没有工作
export const Sync = 1; // 同步工作
export const Never = 2147483647; // 永远不工作
export const Idle = Never - 1; // 空闲时间工作
export const ContinuousHydration = 150; // 连续水合工作时间
export const BatchedHydration = 1000; // 批量水合工作时间
export const UNIT_SIZE = 10;
