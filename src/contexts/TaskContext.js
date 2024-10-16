import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, accessToken } = useContext(AuthContext);
  
  const loadTasksFromLocalStorage = () => {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
  };

  const initialTasks = [];
  const [tasks, setTasks] = useState(loadTasksFromLocalStorage() || initialTasks);

  const saveTasksToLocalStorage = (tasks) => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  };

  useEffect(() => {
    saveTasksToLocalStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    if (isAuthenticated) {
      syncTasks();
    }
  }, [isAuthenticated, accessToken]);

  const syncTasks = async () => {
    try {
      // 1. 서버로부터 전체 리스트를 가져옴 (subTask는 포함되지 않음)
      const listResponse = await axios.get('http://localhost:1009/lists', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const serverLists = listResponse.data;
  
      // 2. 서버 리스트를 로컬 데이터 구조로 변환 (subTask를 포함)
      const formattedServerLists = await Promise.all(
        serverLists.map(async (serverList) => {
          const subTaskResponse = await axios.get(`http://localhost:1009/tasks/${serverList.id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
  
          const serverSubTasks = subTaskResponse.data;
  
          return {
            id: serverList.id,
            title: serverList.title,
            isChecked: serverList.is_visible,
            isSyneced: true,
            subTasks: serverSubTasks.map((subTask) => ({
              id: subTask.id,
              title: subTask.content,
              isChecked: subTask.done,
            })),
          };
        })
      );
  
      // 3. 로컬 스토리지에서 데이터를 가져옴
      const localTasks = loadTasksFromLocalStorage();
      
      // 4. 서버 데이터와 로컬 데이터를 비교하여 동기화
      // 4-1. 로컬에만 있는 데이터를 서버로 추가
      await syncUnsyncedTasks(localTasks);
      // 4-2. 서버에만 있는 데이터를 로컬에서 삭제
      // 4-3. 서버와 로컬에 모두 있는 데이터의 상태 업데이트
    }
    catch (error) {
      console.error(error);
    }
  };
  
  const syncUnsyncedTasks = async (localTasks) => {
    try {
      // 동기화되지 않은 로컬 작업 필터링
      const unsyncedLocalTasks = localTasks.filter((task) => !task.isSynced);
  
      // 동기화되지 않은 작업 동기화
      if (unsyncedLocalTasks.length > 0) {
        const bulkTaskResponse = await axios.post(
          'http://localhost:1009/lists/bulk',
          {
            lists: unsyncedLocalTasks.map((task) => ({
              title: task.title,
              isVisible: task.isChecked,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
  
        const insertedTaskIds = bulkTaskResponse.data?.insertedIds || [];
        console.log('삽입된 작업 ID:', insertedTaskIds);
  
        // 각 작업에 대해 서브 작업 동기화
        await Promise.all(
          unsyncedLocalTasks.map(async (task, index) => {
            const listId = insertedTaskIds[index];
            if (listId) {
              const unsyncedSubTasks = task.subTasks.filter((subTask) => !subTask.isSynced);
              console.log(`작업 ${listId}의 동기화되지 않은 서브 작업:`, unsyncedSubTasks);
  
              if (unsyncedSubTasks.length > 0) {
                console.log(`/tasks/bulk API에 보낼 서브 작업들:`, unsyncedSubTasks);
  
                const bulkSubTaskResponse = await axios.post(
                  'http://localhost:1009/tasks/bulk',
                  {
                    listId: listId,
                    tasks: unsyncedSubTasks.map((subTask) => ({
                      content: subTask.title,
                      done: subTask.isChecked,
                    })),
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  }
                );
                
                console.log('/tasks/bulk API 응답:', bulkSubTaskResponse.data);
                // 삽입된 서브 작업 ID를 시작점으로 각 서브 작업의 ID를 증가시킴
                let insertedSubTaskId = bulkSubTaskResponse.data.insertId;
                console.log('삽입된 서브 작업 시작 ID:', insertedSubTaskId);
  
                unsyncedSubTasks.forEach((subTask) => {
                  subTask.id = insertedSubTaskId++; // ID 할당 후 증가
                  subTask.isSynced = true; // 동기화 완료로 표시
                });
  
                console.log('동기화 후 업데이트된 서브 작업 ID:', unsyncedSubTasks);
              }
  
              task.isSynced = true;
              task.id = listId; // 서버 ID로 작업 ID 업데이트
            }
          })
        );
      }
  
      // 이미 동기화된 작업 중 동기화되지 않은 서브 작업이 있는지 확인
      const syncedTasksWithUnsyncedSubTasks = localTasks.filter(
        (task) => task.isSynced && task.subTasks.some((subTask) => !subTask.isSynced)
      );
  
      if (syncedTasksWithUnsyncedSubTasks.length > 0) {
        await Promise.all(
          syncedTasksWithUnsyncedSubTasks.map(async (task) => {
            const listId = task.id;
            const unsyncedSubTasks = task.subTasks.filter((subTask) => !subTask.isSynced);
            console.log(`이미 동기화된 작업 ${listId}의 동기화되지 않은 서브 작업:`, unsyncedSubTasks);
  
            if (unsyncedSubTasks.length > 0) {
              const bulkSubTaskResponse = await axios.post(
                'http://localhost:1009/tasks/bulk',
                {
                  listId: listId,
                  tasks: unsyncedSubTasks.map((subTask) => ({
                    content: subTask.title,
                    done: subTask.isChecked,
                  })),
                },
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
  
              // 삽입된 서브 작업 ID를 시작점으로 각 서브 작업의 ID를 증가시킴
              let insertedSubTaskId = bulkSubTaskResponse.data.insertId;
              console.log('이미 동기화된 작업에 대한 서브 작업 시작 ID:', insertedSubTaskId);
  
              unsyncedSubTasks.forEach((subTask) => {
                subTask.id = insertedSubTaskId++; // ID 할당 후 증가
                subTask.isSynced = true; // 동기화 완료로 표시
              });
  
              console.log('이미 동기화된 작업의 서브 작업 동기화 후 업데이트된 ID:', unsyncedSubTasks);
            }
          })
        );
      }
  
      // 선택적으로 업데이트된 로컬 작업을 다시 로컬 스토리지에 저장
      saveTasksToLocalStorage(localTasks);
      setTasks(localTasks);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteServerOnlyData = async (formattedServerLists, localTasks) => {
    try {
      // 서버 데이터에서 로컬에 없는 리스트를 찾음
      const serverOnlyLists = formattedServerLists.filter(
        (serverList) => !localTasks.some((localTask) => localTask.id === serverList.id)
      );
  
      // 서버에서만 있는 리스트 삭제
      await Promise.all(
        serverOnlyLists.map(async (serverList) => {
          // 1. 해당 리스트의 서브 작업들을 먼저 삭제
          const deleteSubTaskResponse = await axios.delete(
            `http://localhost:1009/tasks/${serverList.id}`, 
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log(`삭제된 서브 작업 (listId: ${serverList.id}):`, deleteSubTaskResponse.data);
  
          // 2. 리스트 자체를 삭제
          const deleteListResponse = await axios.delete(
            `http://localhost:1009/lists/${serverList.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          console.log(`삭제된 리스트 (listId: ${serverList.id}):`, deleteListResponse.data);
        })
      );
  
      console.log("서버에만 있는 데이터를 모두 삭제했습니다.");
    } catch (error) {
      console.error("서버 데이터 삭제 중 오류 발생:", error);
    }
  };

  const addTask = (newTask) => {
    const taskWithChecked = { ...newTask, isChecked: true };
    setTasks((prevTasks) => [...prevTasks, taskWithChecked]);
  };

  const updateTaskTitle = (taskId, newTitle) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, title: newTitle }
        : task
    ));
  };

  const updateTaskCheck = (taskId, isChecked) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, isChecked }
        : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const addSubTask = (taskId, subTask) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? { ...task, subTasks: [...(task.subTasks || []), subTask] }
          : task
      )
    );
  };

  const updateSubTaskTitle = (taskId, subTaskId, newTitle) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.map(subTask =>
                subTask.id === subTaskId
                  ? { ...subTask, title: newTitle }
                  : subTask
              ),
            }
          : task
      )
    );
  };

  const updateSubTaskCheck = (taskId, subTaskId, isChecked) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.map(subTask =>
                subTask.id === subTaskId
                  ? { ...subTask, isChecked }
                  : subTask
              ),
            }
          : task
      )
    );
  };

  const deleteSubTask = (taskId, subTaskId) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.filter(subTask => subTask.id !== subTaskId),
            }
          : task
      )
    );
  };

  const updateSubTaskOrder = (taskId, reorderedSubTasks) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: reorderedSubTasks,
            }
          : task
      )
    );
  };

  const updateTaskOrder = (reorderedTasks) => {
    setTasks(reorderedTasks);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        syncTasks,
        setTasks,
        addTask,
        updateTaskTitle,
        updateTaskCheck,
        deleteTask,
        addSubTask,
        updateSubTaskTitle,
        updateSubTaskCheck,
        deleteSubTask,
        updateTaskOrder,
        updateSubTaskOrder
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
