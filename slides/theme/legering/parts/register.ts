/**
 * Het register van een slide, gelezen uit de klasse die Slidev uit de
 * frontmatter (`class: nouveau`) als attribuut aan de layout doorgeeft.
 *
 * De meeste layouts hoeven dat niet te weten: het register werkt via de
 * tokens van `.nouveau`, `.deco` en `.messing` (styles/layout.css). Alleen
 * een layout die per register een ander element kiest — `plaat` met zijn
 * kader — leest het hier. De klasse kan een string, een array of een object
 * zijn (Vue's class-binding); alle drie worden gelezen.
 */
export type Register = '' | 'nouveau' | 'deco' | 'messing'

const REGISTERS: Register[] = ['nouveau', 'deco', 'messing']

export function registerOf(value: unknown): Register {
  const names = new Set<string>()
  const collect = (v: unknown): void => {
    if (typeof v === 'string') v.split(/\s+/).forEach(n => n && names.add(n))
    else if (Array.isArray(v)) v.forEach(collect)
    else if (v && typeof v === 'object')
      Object.entries(v as Record<string, unknown>).forEach(([k, on]) => on && names.add(k))
  }
  collect(value)
  return REGISTERS.find(r => names.has(r)) ?? ''
}
