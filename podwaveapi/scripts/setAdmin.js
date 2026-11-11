// Promove (ou rebaixa) um usuário a administrador, direto no banco.
//
// Uso (a partir de podwaveapi/):
//   node scripts/setAdmin.js <username>        -> isAdmin = true
//   node scripts/setAdmin.js <username> off    -> isAdmin = false
//
// Por que um SCRIPT e não uma rota da API: uma rota "me torne administrador"
// precisaria de alguém que já fosse administrador para usá-la — e o primeiro
// administrador não teria como existir (o problema do ovo e da galinha). Se
// a rota fosse aberta, qualquer um se promoveria. Promover é uma decisão de
// quem tem acesso ao SERVIDOR (e ao .env com a senha do banco), não de quem
// tem uma conta no site. O script roda na máquina do servidor, fora da API.
//
// Efeito imediato: como o isAuthenticated consulta o banco a cada requisição,
// o mesmo token passa a valer (ou deixa de valer) para o painel na próxima
// requisição, sem novo login.

// O dotenv precisa vir ANTES de qualquer require que leia process.env
// (config/database.js lê DB_NAME, DB_USER... no momento do require).
require('dotenv').config();

const sequelize = require('../config/database');
const User = require('../modules/user/userModel');

async function main() {
  const username = process.argv[2];
  const turnOff = process.argv[3] === 'off';

  if (!username) {
    console.error('Uso: node scripts/setAdmin.js <username> [off]');
    process.exitCode = 1;
    return;
  }

  try {
    const user = await User.findOne({ where: { username }, attributes: ['id', 'username', 'isAdmin'] });

    if (!user) {
      console.error(`Usuário "${username}" não encontrado.`);
      process.exitCode = 1;
      return;
    }

    user.isAdmin = !turnOff;
    await user.save();

    console.log(turnOff
      ? `"${user.username}" (id ${user.id}) deixou de ser administrador.`
      : `"${user.username}" (id ${user.id}) agora é administrador.`);
  } catch (err) {
    console.error('Erro ao alterar o papel:', err.message);
    process.exitCode = 1;
  } finally {
    // Sem isto, o pool de conexões do Sequelize mantém o processo vivo e o
    // terminal fica "preso" depois da mensagem.
    await sequelize.close();
  }
}

main();
