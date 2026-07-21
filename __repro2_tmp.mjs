// Replicates AIAssistant.tsx exactly: the approve handler (line ~1044) feeding
// executeOrchestratedAction (line ~772). No app imports — just the same code.

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// --- approve handler, verbatim shape (line 1044-1051) ---
function buildFinalAction(actionObj, forcedOperation, targetId) {
  return {
    ...actionObj,
    operation: forcedOperation || actionObj.operation,
    payload: {
      ...actionObj.payload,
      id: targetId !== undefined ? targetId : actionObj.payload?.id,
    },
  }
}

// --- executeOrchestratedAction, placement branch, verbatim logic ---
function execute(prev, action) {
  const { operation, payload } = action
  const updated = [...(prev || [])]
  const existingIdx =
    operation === 'update'
      ? updated.findIndex(
          (c) =>
            c.id === payload.id ||
            (c.name?.toLowerCase() === payload.name?.toLowerCase() && !payload.id),
        )
      : -1

  if (existingIdx > -1) {
    updated[existingIdx] = { ...updated[existingIdx], ...payload }
  } else {
    updated.push({
      id: generateId(),
      ...payload,
      createdAt: new Date().toISOString(),
      history: payload.history?.length ? payload.history : [{ stage: 'Resume/CGPA', status: 'Preparing' }],
      schedule: [],
    })
  }
  return updated
}

const action = (name, operation) => ({
  entity: 'placement',
  operation,
  requiresConfirmation: true,
  payload: { name, role: 'SWE', kind: 'placement', compensation: { amount: 10, unit: 'LPA' }, optedIn: true },
})

const ok = (label, cond) => console.log(`${cond ? 'PASS' : '*** FAIL'}  ${label}`)

console.log('=== Step 1: does the approve handler inject id:undefined? ===')
const fa = buildFinalAction(action('Rubrik', 'create'), undefined, undefined)
console.log("payload has own key 'id':", 'id' in fa.payload, '| value:', fa.payload.id)
ok('id key is injected with value undefined', 'id' in fa.payload && fa.payload.id === undefined)

console.log('\n=== Step 2: does that clobber the generated id? ===')
let list = execute([], fa)
console.log('stored record id:', list[0].id)
ok('generated id was overwritten by undefined', list[0].id === undefined)
console.log('after JSON round-trip (what localStorage holds):')
console.log(' ', JSON.stringify(JSON.parse(JSON.stringify(list))[0]).slice(0, 80) + '…')
ok('id key vanishes entirely from storage', !('id' in JSON.parse(JSON.stringify(list))[0]))

console.log('\n=== Step 3: the prompt tells the model to emit "update" when the')
console.log('    name matches an existing entry. What happens on the 2nd add? ===')
list = []
list = execute(list, buildFinalAction(action('Rubrik', 'update'), undefined, undefined))
console.log('after adding Rubrik :', list.map((c) => c.name).join(', '), '| count', list.length)
list = execute(list, buildFinalAction(action('Zomato', 'update'), undefined, undefined))
console.log('after adding Zomato :', list.map((c) => c.name).join(', '), '| count', list.length)
list = execute(list, buildFinalAction(action('Swiggy', 'update'), undefined, undefined))
console.log('after adding Swiggy :', list.map((c) => c.name).join(', '), '| count', list.length)
ok('list should hold 3 companies', list.length === 3)
console.log('\n  ^ each new company matched the previous id-less one via')
console.log('    `c.id === payload.id` (undefined === undefined) and REPLACED it.')
