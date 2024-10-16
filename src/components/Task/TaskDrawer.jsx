import React, { useEffect, useState, useContext } from 'react';
import { TaskContext } from '../../contexts/TaskContext';
import { BsPlusCircleDotted } from "react-icons/bs";
import { MdOutlineModeEdit } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import Modal from "../Common/Modal";
import Button from "../Common/Button";
import InputCheck from "../Common/InputCheck";
import InputField from "../Common/InputField";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function TaskDrawer() {
  const { lists, fetchLists, addList, updateList, deleteList, reorderLists } = useContext(TaskContext); // 수정된 부분: addList로 변경
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentListId, setCurrentListId] = useState(null);

  // 데이터 로드
  useEffect(() => {
    if (lists.length === 0) {
      fetchLists();  // 리스트가 없을 때만 호출
    }
  }, [fetchLists, lists.length]); // fetchLists 의존성 추가

  // 공통된 입력 필드 초기화 함수
  const resetModal = () => {
    setInputValue('');
    setIsEditing(false);
    setOpen(false);
  };

  // 새 목록 추가
  const handleAddList = () => {
    if (inputValue.trim() === '') return;  // 입력값이 공백이면 추가하지 않음
    addList({ title: inputValue });
    resetModal();
  };

  // 목록 수정
  const handleRenameList = () => {
    if (inputValue.trim() === '') return;  // 입력값이 공백이면 수정하지 않음
    const listToUpdate = lists.find(list => list.id === currentListId);
    if (!listToUpdate) return console.error('List not found');
    updateList(currentListId, inputValue, listToUpdate.isVisible);  // 제목과 isVisible 값 업데이트
    resetModal();
  };

  // 목록 삭제
  const handleDeleteList = (id) => deleteList(id);

  // 드래그앤드랍 순서 변경 핸들러
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    reorderLists(source.index, destination.index); // 순서 변경 함수 호출
  };

  // 모달 열기
  const openListModal = (list = {}) => {
    setCurrentListId(list.id || null);
    setInputValue(list.title || '');
    setIsEditing(!!list.id);  // 리스트가 있으면 수정 모드, 없으면 추가 모드
    setOpen(true);
  };

  return (
    <>
      <div>
        <button
          className="w-full h-8 mt-2 p-2 flex items-center hover:text-blue-600 hover:rounded-lg hover:bg-gray-200"
          onClick={() => openListModal()} // 새 목록 만들기 모달 열기
        >
          <BsPlusCircleDotted />
          <p className="ml-2">새 목록 만들기</p>
        </button>

        {lists && lists.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lists">
              {(provided) => (
                <div
                  className="lists w-64"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {lists.map((list, index) => (
                    <Draggable key={list.id} draggableId={list.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`h-8 mt-3 flex items-center hover:rounded-lg hover:bg-gray-200 ${snapshot.isDragging ? 'bg-gray-300' : ''}`}
                        >
                          <InputCheck
                            checked={list.isVisible}
                            onChange={() => updateList(list.id, list.title, !list.isVisible)} // 상태 변경 핸들러 추가
                          />
                          <p className="w-10/12">
                            {list.title.length > 10 ? `${list.title.slice(0, 10)}...` : list.title}
                          </p>
                          <Button onClick={() => openListModal(list)}><MdOutlineModeEdit /></Button>
                          <Button onClick={() => handleDeleteList(list.id)}><RiDeleteBin5Line /></Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <p>리스트가 없습니다.</p>
        )}
      </div>

      {/* 목록 추가/수정 모달 */}
      <Modal isOpen={open} onClose={resetModal} closeBtn={true}>
        <div>
          <p className="font-semibold text-lg text-center mb-4">
            {isEditing ? '목록 수정하기' : '새 목록 만들기'}
          </p>
          <InputField
            placeholder="목록 이름 입력"
            value={inputValue || ''}  // 기본값을 빈 문자열로 설정하여 경고 해결
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                isEditing ? handleRenameList() : handleAddList();
              }
            }}
          />
          <div className="flex justify-around text-center">
            <Button color="green" onClick={() => (isEditing ? handleRenameList() : handleAddList())}>
              완료
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default TaskDrawer;
