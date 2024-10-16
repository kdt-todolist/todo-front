import { TaskContext } from "../../contexts/TaskContext";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { BsPlusCircleDotted } from "react-icons/bs";
import { MdOutlineModeEdit } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { useState, useContext, useEffect } from "react";
import Button from "../Common/Button";
import InputCheck from "../Common/InputCheck";
import InputField from "../Common/InputField";
import Modal from '../Common/Modal';

function TaskCard({ list, dragHandleProps }) {
  const { tasks, fetchTasks, addTask, updateTask, deleteTask, reorderTasks } = useContext(TaskContext);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [isCompletedVisible, setIsCompletedVisible] = useState(true);
  const [selectedDaysMap, setSelectedDaysMap] = useState({});

  const days = ["월", "화", "수", "목", "금", "토", "일"];

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      fetchTasks(list.id);
    }
  }, [tasks]);

  const handleaddTasks = () => {
    if (inputValue.trim() === '') return;

    const newTask = { id: Date.now(), text: inputValue, isChecked: false };
    addTask(list.id, newTask);
    setInputValue('');
    setOpen(false);
  };

  const handleupdateTasks = () => {
    if (inputValue.trim() === '') return;

    updateTask(list.id, currentTaskId, inputValue);
    setInputValue('');
    setIsEditing(false);
    setOpen(false);
  };

  const handleTaskDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedSubTasks = Array.from(list.subTasks);
    const [movedSubTask] = reorderedSubTasks.splice(result.source.index, 1);
    reorderedSubTasks.splice(result.destination.index, 0, movedSubTask);

    reorderTasks(list.id, reorderedSubTasks);
  };

  const toggleDay = (subTaskId, day) => {
    setSelectedDaysMap((prev) => {
      const currentDays = prev[subTaskId] || [];
      return {
        ...prev,
        [subTaskId]: currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day],
      };
    });
  };

  // 완료된 서브 태스크와 미완료 서브 태스크 분리
  const completedSubTasks = list.tasks?.filter(task => task.isChecked) || [];
  const incompleteSubTasks = list.tasks?.filter(task => !task.isChecked) || [];

  return (
    <>
      <div className="w-96 h-96 m-4 p-2 bg-white shadow-md rounded-lg hover:shadow-gray-400 overflow-y-auto">
        {/* Only this part (header) will be draggable for list order */}
        <div {...dragHandleProps} className="flex justify-between items-center cursor-pointer p-2 rounded-t-lg">
          <h3 className="text-lg font-semibold">{list.title}</h3>
        </div>

        <Button className="w-40 h-8 mt-2 ml-2 text-blue-600 rounded-full flex items-center" onClick={() => setOpen(true)}>
          <BsPlusCircleDotted />
          <p className="ml-2">할 일 추가</p>
        </Button>

        <DragDropContext onDragEnd={handleTaskDragEnd}>
          <Droppable droppableId={`subtask-${list.id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {incompleteSubTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mt-3 hover:rounded-lg hover:bg-gray-100"
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.5 : 1,
                        }}
                      >
                        <div className="flex items-center">
                          <InputCheck
                            shape="round"
                            checked={task.isChecked}
                            onChange={() => updateTask(list.id, task.id, !task.isChecked)}
                          />
                          <p className="w-10/12">{task.text}</p>

                          <Button
                            className="ml-2 mr-2"
                            onClick={() => {
                              setCurrentTaskId(task.id);
                              setInputValue(task.text);
                              setIsEditing(true);
                              setOpen(true);
                            }}
                          >
                            <MdOutlineModeEdit />
                          </Button>

                          <Button onClick={() => deleteTask(list.id, task.id)}><RiDeleteBin5Line /></Button>
                        </div>

                        {/* 요일 선택 추가 */}
                        <div className="flex mt-2 justify-center">
                          {days.map((day) => (
                            <button
                              key={day}
                              className={`mr-1 p-2 rounded-full ${selectedDaysMap[task.id]?.includes(day) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                              onClick={() => toggleDay(task.id, day)}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* 완료된 서브 태스크 섹션 */}
        {completedSubTasks.length > 0 && (
          <div className="mt-4">
            <Button onClick={() => setIsCompletedVisible(!isCompletedVisible)}>
              {isCompletedVisible ? '▼ 완료됨' : '▲ 완료됨'}
            </Button>
            {isCompletedVisible && (
              <div>
                {completedSubTasks.map((task) => (
                  <div key={task.id} className="flex mt-3 hover:rounded-lg hover:bg-gray-100">
                    <InputCheck
                      shape="round"
                      checked={task.isChecked}
                      onChange={() => updateTask(list.id, task.id, !task.isChecked)}
                    />
                    <p className="w-10/12 line-through text-gray-500">{task.text}</p>

                    <Button onClick={() => deleteTask(list.id, task.id)}><RiDeleteBin5Line /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for adding or editing subtasks */}
      <Modal isOpen={open} onClose={() => setOpen(false)} closeBtn={true}>
        <div>
          <p className="font-semibold text-lg text-center mb-4">
            {isEditing ? '서브 태스크 수정하기' : '서브 태스크 추가하기'}
          </p>

          <InputField
            placeholder="서브 태스크 입력"
            value={inputValue || ''}  // 기본값을 빈 문자열로 설정하여 경고 해결
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                isEditing ? handleupdateTasks() : handleaddTasks();
              }
            }}
          />

          <div className="flex justify-around text-center">
            <Button
              color="green"
              onClick={() => {
                isEditing ? handleupdateTasks() : handleaddTasks();
              }}
            >
              완료
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default TaskCard;
