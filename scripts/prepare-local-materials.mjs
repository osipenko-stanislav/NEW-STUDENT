// Prepared demo bytes only. This does not contact a server or synchronize files.
import fs from 'node:fs'
import { academicMaterials } from '../src/data/academic-data.ts'
const files = academicMaterials.map(material => ({ id: material.id, bytes: fs.readFileSync(`public/${material.url}`).toString('base64') }))
fs.writeFileSync('src/data/local-materials.ts', '// Prepared local demo bytes. Regenerate with scripts/prepare-local-materials.mjs.\nexport default ' + JSON.stringify(files) + '\n')
