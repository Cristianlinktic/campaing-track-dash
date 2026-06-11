// Genera un hash bcrypt para crear/actualizar usuarios manualmente.
//   node scripts/hash-password.mjs "miClaveSegura"
// Luego en Supabase SQL:
//   insert into users (username, password_hash, display_name)
//   values ('nombre', '<hash>', 'Nombre Visible');

import bcrypt from "bcryptjs";

const plain = process.argv[2];
if (!plain) {
  console.error('Uso: node scripts/hash-password.mjs "tu-contraseña"');
  process.exit(1);
}

const hash = await bcrypt.hash(plain, 10);
console.log(hash);
