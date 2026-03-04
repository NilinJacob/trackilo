export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
} as const;

export type UserRoles = (typeof UserRolesEnum)[keyof typeof UserRolesEnum];

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusesEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;
export type TaskStatuses = (typeof TaskStatusesEnum)[keyof typeof TaskStatusesEnum];

export const AvailableTaskStatuses = Object.values(TaskStatusesEnum);
