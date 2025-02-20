import React, { useState, useEffect } from 'react';

const PopupPreview = ({ popupData }) => {
  const {
    popupType,
    content,
    width,
    height,
    position,
    animation
  } = popupData;

  // Määritellään sijainnin tyylit
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'center':
        return { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <div className="w-full h-96 bg-gray-100 relative rounded-lg overflow-hidden">
      <div
        className={`bg-white shadow-lg p-4 absolute
          ${animation === 'fade' ? 'animate-fade-in' : ''}
          ${animation === 'slide' ? 'animate-slide-in' : ''}
          ${popupType === 'circle' ? 'rounded-full' : 'rounded-lg'}
        `}
        style={{
          width: width ? `${width}px` : '200px',
          height: height ? `${height}px` : '150px',
          ...getPositionStyles()
        }}
      >
        <div className="h-full flex items-center justify-center">
          {content}
        </div>
      </div>
    </div>
  );
};

export default PopupPreview;