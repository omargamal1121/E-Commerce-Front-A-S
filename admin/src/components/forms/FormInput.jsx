import React from "react";

const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  min,
  max,
  options,
  multiple = false,
  accept,
  hidden = false,
  children,
}) => {
  const baseInputClass = "w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500";
  const disabledClass = disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "";
  const inputClass = `${baseInputClass} ${disabledClass} ${className}`;

  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className={inputClass}
            required={required}
            disabled={disabled}
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options &&
              options.map((option , key) => (
                <option key={option.id || option.value || key} value={option.id || option.value}>
                  {option.name || option.label}
                </option>
              ))}
          </select>
        );

      case "textarea":
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClass}
            required={required}
            disabled={disabled}
          />
        );

      case "file":
        return (
          <div className="w-full">
            <label htmlFor={name} className="cursor-pointer">
              <div className="w-full h-16 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-500 text-xs">
                  {value && multiple
                    ? `${Array.isArray(value) ? value.length : 1} files selected`
                    : value
                    ? "File selected"
                    : "Click to upload" + (multiple ? " multiple files" : "")}
                </span>
              </div>
            </label>
            <input
              type="file"
              id={name}
              name={name}
              onChange={onChange}
              className="hidden"
              required={required}
              disabled={disabled}
              multiple={multiple}
              accept={accept}
            />
          </div>
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={inputClass}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            hidden={hidden}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {children}
    </div>
  );
};

export default FormInput;