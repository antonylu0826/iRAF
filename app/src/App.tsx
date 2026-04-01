import { IRAF_VERSION } from "@iraf/core"
import { IRAF_REACT_VERSION } from "@iraf/react"

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">iRAF</h1>
        <p className="text-slate-500">i Rapid Application Framework</p>
        <div className="text-sm text-slate-400 space-y-1 pt-4">
          <p>@iraf/core v{IRAF_VERSION}</p>
          <p>@iraf/react v{IRAF_REACT_VERSION}</p>
        </div>
      </div>
    </div>
  )
}
