import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import axios from 'axios';
import { isVisible } from '@testing-library/user-event/dist/utils';

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

  const fetchTasks = async () => {
    try {
      // 1. 서버로부터 전체 리스트를 가져옴 (subTask는 포함되지 않음)
      const { data: serverLists } = await axios.get('http://localhost:1009/lists', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

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

      setTasks(formattedServerLists);
    } catch (error) {
      console.error(error);
    }
  };

  const addTask = async (addedTask) => {
    if (!isAuthenticated) {
      setTasks((prevTasks) => [...prevTasks, addedTask]);
    }
    else {
      try {
        const response = await axios.post('http://localhost:1009/lists', {
          title: addedTask.title,  // title만 서버로 전송
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`  // 인증 토큰 설정
          }
        });

        console.log(response.data);
    
        // 응답에서 리스트 ID를 받아 추가 리스트에 대한 기본 값 설정
        const addedTask = {
          ...addedTask,
          id: response.data.insertId
        };

        console.log(addedTask);
    
        // 리스트 상태 업데이트
        setTasks((prevTasks) => [...prevTasks, addedTask]);
      } catch (error) {
        alert('리스트 추가 중 오류가 발생했습니다.');
      }
    }
  };

  const updateTask = async (updatedTask) => {
    if (!isAuthenticated) {
      console.log("Not Authenticated", updatedTask);
  
      // 비로그인 상태에서는 로컬 상태만 업데이트
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id
            ? { ...task, title: updatedTask.title, isChecked: updatedTask.isChecked }
            : task
        )
      );
    } else {
      console.log("Authenticated", updatedTask);
  
      try {
        // 로그인 상태에서 서버에 업데이트 요청
        const response = await axios.put(
          `http://localhost:1009/lists/${updatedTask.id}`,
          {
            title: updatedTask.title,
            isVisible: updatedTask.isChecked,
          },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );
  
        // 서버에서 반환된 데이터를 사용해 업데이트된 Task 객체 생성
        const updatedServerTask = {
          ...updatedTask,
          id: response.data.insertId || updatedTask.id, // 서버에서 새로운 ID가 반환되면 사용, 없으면 기존 ID 유지
        };
  
        console.log("updatedServerTask", updatedServerTask);
  
        // 로컬 상태 업데이트
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedServerTask.id
              ? updatedServerTask // 서버에서 반환된 데이터를 사용해 업데이트
              : task
          )
        );
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };
  

  const deleteTask = (taskId) => {
    if (!isAuthenticated) {
      setTasks(tasks.filter(task => task.id !== taskId));
    } else {
      try {
        axios.delete(`http://localhost:1009/lists/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        setTasks(tasks.filter(task => task.id !== taskId));
      }
      catch (error) {
        console.error("Error deleting task:", error);
      }
    }
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


  useEffect(() => {
    console.log("isAuthenticated", isAuthenticated);
    console.log("accessToken", accessToken);

    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    saveTasksToLocalStorage(tasks);
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        fetchTasks,
        setTasks,
        addTask,
        updateTask,
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
