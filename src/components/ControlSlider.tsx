import React from "react";

interface ControlSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  defaultValue?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  label,
  min,
  max,
  step,
  value,
  defaultValue,
  unit = "",
  onChange,
}) => {
  const getMarkerPosition = () => {
    if (defaultValue === undefined) return null;
    const percent = ((defaultValue - min) / (max - min)) * 100;
    return `${percent}%`;
  };

  const markerPos = getMarkerPosition();

  return (
    <div className="control-slider">
      <div className="slider-header">
        <label>{label}</label>
        <span className="value-display">
          {value.toFixed(2)}
          {unit}
        </span>
      </div>
      <div className="slider-container">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {markerPos && (
          <div 
            className="slider-marker" 
            style={{ left: markerPos }}
            title={`Default: ${defaultValue}${unit}`}
          />
        )}
      </div>
    </div>
  );
};
