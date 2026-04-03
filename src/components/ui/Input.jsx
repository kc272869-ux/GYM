/**
 * components/ui/Input.jsx
 * -----------------------
 * Input reutilizable con label integrado.
 * Pasar label, error y helperText como props simplifica los formularios.
 */
export default function Input({ label, error, helperText, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 rounded-lg border text-sm
          bg-gray-800 border-gray-700 text-gray-100
          placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      {error         && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
