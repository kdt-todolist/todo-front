import React, { useContext, useState } from 'react';
import { TaskContext } from '../../contexts/TaskContext';
import TaskCard from './TaskCard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function TaskDashboard() {
  const { lists, reorderLists } = useContext(TaskContext);
  const [showCompleted, setShowCompleted] = useState(true);

  // list 중에서 isVisible 값이 true인 것들만 필터링
  const visibleLists = lists.filter(list => list.isVisible);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const reorderedLists = Array.from(visibleLists); // 기존 lists 대신 visibleLists 사용
    const [movedList] = reorderedLists.splice(source.index, 1);
    reorderedLists.splice(destination.index, 0, movedList);

    reorderLists(reorderedLists); // TaskContext의 reorderList로 순서 업데이트
  };

  return (
    <div className="flex-1 p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="droppable-lists">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {lists && lists.map((list, index) => (
              <Draggable
                key={list.id ? list.id.toString() : `temp-${index}`}  // id가 없을 경우 임시 key 사용
                draggableId={list.id ? list.id.toString() : `temp-${index}`}
                index={index}
              >
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <TaskCard list={list} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      </DragDropContext>
    </div>
  );
}

export default TaskDashboard;
