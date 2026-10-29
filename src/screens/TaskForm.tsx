import React from 'react';
import { useStore } from '../store';
import TaskSheet from '../components/TaskSheet';
import type { Nav } from '../navigation';

/**
 * Route wrapper around TaskSheet. Creating: taskId is undefined, date may be
 * pre-filled (from Timeline / Plan). Editing: loads the task + subtasks from
 * the store. Save writes through the store actions, which also handle
 * auto-finish; delete removes the task and its subtasks.
 */
export default function TaskForm({ nav, taskId, date }: { nav: Nav; taskId?: string; date?: string }): React.JSX.Element {
  const { state, isPremium, addTask, updateTask, deleteTask, addSubTask, deleteSubTask } = useStore();
  const task = taskId ? state.tasks.find((t) => t.id === taskId) : undefined;
  const initialSubtasks = task ? state.subtasks.filter((s) => s.taskId === task.id) : [];

  function save(savedTask: import('../types').Task, savedSubs: import('../types').SubTask[]) {
    if (task) {
      updateTask(savedTask);
      // Replace the task's subtask set: delete the old set, then add the
      // edited set back (same ids for kept subtasks, so nothing else breaks).
      initialSubtasks.forEach((s) => deleteSubTask(s.id));
      savedSubs.forEach((s) => addSubTask(s));
    } else {
      addTask(savedTask);
      savedSubs.forEach((s) => addSubTask(s));
    }
    nav.pop();
  }

  return (
    <TaskSheet
      initialTask={task ?? null}
      initialSubtasks={initialSubtasks}
      defaultDate={date}
      isPremium={isPremium}
      onOpenPaywall={nav.openPaywall}
      onSave={save}
      onDelete={task ? () => { deleteTask(task.id); nav.pop(); } : undefined}
      onCancel={nav.pop}
    />
  );
}
