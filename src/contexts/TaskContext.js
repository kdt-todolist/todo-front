import React, { createContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [lists, setLists] = useState([]);  // 리스트 목록 상태
  
  // 최신 리스트 목록을 서버에서 가져오는 함수
  const fetchLists = async () => {
    try {
      const response = await axios.get('http://localhost:1009/lists', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
  
      const newLists = response.data || [];
      // console.log('newLists:', newLists);
      
      // 서버에서 받은 데이터를 formattedList 형식으로 변환
      const formattedLists = newLists.map((newList) => ({
        id: newList.id,                      // id 그대로 사용
        title: newList.title,                // title 그대로 사용
        isVisible: newList.is_visible === 1  // is_visible을 true/false로 변환
      }));
  
      // 이전 상태와 비교하여 변경된 리스트만 업데이트
      setLists((prevLists) => {
        // 1. 삭제된 리스트: 기존 리스트 중 새로 가져온 리스트에 없는 리스트는 삭제
        const updatedLists = prevLists.filter((prevList) => 
          formattedLists.some((newList) => newList.id === prevList.id)
        );
  
        // 2. 새로 추가된 리스트: 기존 리스트에 없는 리스트는 추가
        const newOrUpdatedLists = formattedLists.filter((newList) =>
          !prevLists.some((prevList) => prevList.id === newList.id)
        );
  
        // 3. 기존 리스트 중 업데이트가 필요한 리스트는 교체
        const finalLists = updatedLists.map((prevList) => {
          const updatedList = formattedLists.find((newList) => newList.id === prevList.id);
          return updatedList ? { ...prevList, ...updatedList } : prevList;
        });
  
        // 최종적으로 기존 리스트에서 삭제된 것 제거, 새로 추가된 것 추가
        return [...finalLists, ...newOrUpdatedLists];
      });
    } catch (error) {
      alert('리스트를 가져오는 중 오류가 발생했습니다.');
    }
  };  
  
  // 리스트 POST 요청을 보내 리스트를 추가하는 함수
  const addList = async (newList) => {
    try {
      const response = await axios.post('http://localhost:1009/lists', {
        title: newList.title,  // title만 서버로 전송
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`  // 인증 토큰 설정
        }
      });
  
      // 응답에서 리스트 ID를 받아 추가 리스트에 대한 기본 값 설정
      const addedList = {
        ...newList,
        id: response.data.id,  // 서버에서 생성된 리스트 ID
        tasks: [], // subTasks를 포함
        isVisible: true  // 기본적으로 체크된 상태로 추가
      };
  
      // 리스트 상태 업데이트
      setLists((prevLists) => [...prevLists, addedList]);
    } catch (error) {
      alert('리스트 추가 중 오류가 발생했습니다.');
    }
  };  

  // 리스트 PUT 요청을 보내 리스트 이름과 상태를 업데이트하는 함수
  const updateList = async (listId, title, isVisible) => {
    try {
      await axios.put(`http://localhost:1009/lists/${listId}`, {
        title: title,
        isVisible: isVisible
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setLists((prevLists) => prevLists.map(list => {
        if (list.id === listId) {
          return { ...list, title, isVisible };
        }
        return list;
      }));
    } catch (error) {
      alert('리스트 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 리스트 DELETE 요청을 보내 리스트를 삭제하는 함수
  const deleteList = async (listId) => {
    try {
      await axios.delete(`http://localhost:1009/lists/${listId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      setLists((prevLists) => prevLists.filter(list => list.id !== listId));
    } catch (error) {
      alert('리스트 삭제 중 오류가 발생했습니다.');
    }
  };

  const reorderLists = async (sourceIndex, destinationIndex) => {
    const reorderedLists = [...lists]; // Create a copy of the lists for reordering
  
    // Optimistically reorder the lists in the UI
    const [movedList] = reorderedLists.splice(sourceIndex, 1); // Remove the item from source
    reorderedLists.splice(destinationIndex, 0, movedList); // Insert it at the destination
    setLists(reorderedLists); // Update the UI optimistically
  
    try {
      // Make the API requests in the background after UI is updated
      if (sourceIndex < destinationIndex) {
        // Moving from a lower index to a higher index
        const tempTitle = movedList.title; // Save the source list title
        for (let i = sourceIndex; i < destinationIndex; i++) {
          await axios.put(`http://localhost:1009/lists/${lists[i].id}`, {
            title: lists[i + 1].title,
            isVisible: lists[i].isVisible
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
        }
  
        await axios.put(`http://localhost:1009/lists/${lists[destinationIndex].id}`, {
          title: tempTitle,
          isVisible: lists[destinationIndex].isVisible
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
  
      } else if (sourceIndex > destinationIndex) {
        // Moving from a higher index to a lower index
        const tempTitle = movedList.title;
        for (let i = sourceIndex; i > destinationIndex; i--) {
          await axios.put(`http://localhost:1009/lists/${lists[i].id}`, {
            title: lists[i - 1].title,
            isVisible: lists[i].isVisible
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
        }
  
        await axios.put(`http://localhost:1009/lists/${lists[destinationIndex].id}`, {
          title: tempTitle,
          isVisible: lists[destinationIndex].isVisible
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
      }
  
    } catch (error) {
      alert('Reordering failed. Reverting changes.');
      setLists(lists);
    }
  };

  // 특정 리스트에 대한 모든 할 일을 가져와 해당 리스트에 할 일을 업데이트하는 함수
  const fetchTasks = async (listId) => {
    try {
      // 특정 listId에 대한 할 일 가져오기
      const response = await axios.get(`http://localhost:1009/tasks/${listId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
  
      const tasks = response.data || [];
      
      // 각 할 일을 가공하여 새로운 형식으로 변환
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        title: task.content,       // content를 title로 변경
        isDone: task.done,         // done을 isDone으로 변경
        isRoutine: task.is_routine // is_routine을 isRoutine으로 변경
      }));
      
      // 리스트 상태 업데이트: 변경된 항목만 업데이트
      setLists((prevLists) =>
        prevLists.map((list) => {
          if (list.id === listId) {
            // 현재 리스트에 저장된 tasks와 새로 가져온 formattedTasks를 비교
            const existingTasks = list.tasks || [];
            const isTasksChanged = JSON.stringify(existingTasks) !== JSON.stringify(formattedTasks);
  
            // tasks가 변경된 경우에만 업데이트
            if (isTasksChanged) {
              return { ...list, tasks: formattedTasks };
            }
          }
          return list;  // 다른 리스트는 변경하지 않음
        })
      );

      console.log('lists:', lists);
    } catch (error) {
      console.error('할 일을 가져오는 중 오류:', error);
      alert('할 일을 가져오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <TaskContext.Provider
      value={{
        lists,
        fetchLists, addList, updateList, deleteList, reorderLists,
        fetchTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
