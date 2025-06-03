import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DraggableBox = ({
    id,
    x,
    y,
    width,
    height,
    label,
    onUpdate,
    onDelete,
}) => {
    const boxRef = useRef(null);
    const isResizingRef = useRef(false);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialBoxRef = useRef({ x, y, width, height });
    const [hideLabel, setHideLabel] = useState(false);

    const handleMouseDown = (e) => {
        if (e.target.classList.contains("resize-handle")) return;
        isDraggingRef.current = true;
        setHideLabel(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialBoxRef.current = { x, y, width, height };
    };

    const handleResizeMouseDown = (e) => {
        e.stopPropagation();
        isResizingRef.current = true;
        setHideLabel(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        initialBoxRef.current = { x, y, width, height };
    };

    const handleMouseMove = (e) => {
        if (!boxRef.current) return;

        if (isDraggingRef.current) {
            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;
            onUpdate(id, {
                x: initialBoxRef.current.x + deltaX,
                y: initialBoxRef.current.y + deltaY,
            });
        } else if (isResizingRef.current) {
            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;
            onUpdate(id, {
                width: initialBoxRef.current.width + deltaX,
                height: initialBoxRef.current.height + deltaY,
            });
        }
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        isResizingRef.current = false;
        setHideLabel(false);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const confirmDelete = window.confirm("Delete this box?");
        if (confirmDelete) {
            onDelete(id);
        }
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    });

    return (
        <div
            ref={boxRef}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            className={`${label?.includes('option') ? 'option-box' : 'question-box'}`}
            data-question-id={label?.split('_')[0]}
            data-box-type={label?.includes('option') ? 'option' : 'question'}
            style={{
                position: "absolute",
                left: x,
                top: y,
                width,
                height,
                border: "2px solid #FF5252",
                boxSizing: "border-box",
                cursor: "move",
                zIndex: 10,
            }}
        >
            {!hideLabel && (
                <div
                    style={{
                        position: "absolute",
                        top: -20,
                        left: 0,
                        background: "#FF5252",
                        color: "white",
                        fontSize: "12px",
                        padding: "0px 4px",
                        whiteSpace: "nowrap",
                        borderRadius: "4px 4px 4px 0",
                    }}
                >
                    {label || `Box #${id}`}
                </div>
            )}

            <div
                className="resize-handle"
                onMouseDown={handleResizeMouseDown}
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "15px",
                    height: "15px",
                    background: "#1976D2",
                    cursor: "se-resize",
                }}
            />
        </div>
    );
};

DraggableBox.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    label: PropTypes.string,
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default DraggableBox;