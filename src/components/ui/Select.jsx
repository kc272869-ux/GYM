/**
 * components/ui/Select.jsx
 * Dropdown estilizado consistente con el resto de inputs.
 */
export default function Select({ label, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={`
          w-full px-3 py-2 rounded-lg border text-sm
          bg-gray-800 border-gray-700 text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
