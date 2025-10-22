import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient.js';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testInstituicoes() {
  console.log('\n🏁 Teste realtime: public.instituicoes');
  if (!supabaseAdmin) {
    console.error('❌ Supabase Admin não configurado');
    return;
  }

  // INSERT
  const nome = `Instituição Teste Realtime ${new Date().toISOString()}`;
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('instituicoes')
    .insert({ nome })
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Erro no INSERT instituicoes:', insertErr.message);
    return;
  }
  console.log('✅ INSERT instituicoes:', inserted);
  const instituicaoId = inserted.id;

  await sleep(1000);

  // UPDATE
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('instituicoes')
    .update({ status: 'evadida', evasao_motivo: 'Teste realtime', evasao_data: new Date().toISOString().slice(0, 10) })
    .eq('id', instituicaoId)
    .select('*')
    .single();

  if (updateErr) {
    console.error('❌ Erro no UPDATE instituicoes:', updateErr.message);
    return;
  }
  console.log('✅ UPDATE instituicoes:', updated);

  await sleep(1000);

  // DELETE
  const { error: deleteErr } = await supabaseAdmin
    .from('instituicoes')
    .delete()
    .eq('id', instituicaoId);

  if (deleteErr) {
    console.error('❌ Erro no DELETE instituicoes:', deleteErr.message);
    return;
  }
  console.log('✅ DELETE instituicoes realizado');
}

async function testRegionalActivities() {
  console.log('\n🏁 Teste realtime: public.regional_activities');
  if (!supabaseAdmin) {
    console.error('❌ Supabase Admin não configurado');
    return;
  }

  // INSERT
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('regional_activities')
    .insert({ title: `Atividade Teste Realtime ${new Date().toISOString()}`, activity_date: new Date().toISOString().slice(0, 10), type: 'teste', regional: 'sp' })
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Erro no INSERT regional_activities:', insertErr.message);
    return;
  }
  console.log('✅ INSERT regional_activities:', inserted);
  const activityId = inserted.id;

  await sleep(1000);

  // UPDATE
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('regional_activities')
    .update({ title: 'Atividade Teste Realtime (atualizada)', description: 'Atualização de teste', atividade_custom_label: 'teste-realtime' })
    .eq('id', activityId)
    .select('*')
    .single();

  if (updateErr) {
    console.error('❌ Erro no UPDATE regional_activities:', updateErr.message);
    return;
  }
  console.log('✅ UPDATE regional_activities:', updated);

  await sleep(1000);

  // DELETE
  const { error: deleteErr } = await supabaseAdmin
    .from('regional_activities')
    .delete()
    .eq('id', activityId);

  if (deleteErr) {
    console.error('❌ Erro no DELETE regional_activities:', deleteErr.message);
    return;
  }
  console.log('✅ DELETE regional_activities realizado');
}

async function main() {
  console.log('🚀 Iniciando testes de realtime para instituicoes e regional_activities...');
  await testInstituicoes();
  await sleep(1000);
  await testRegionalActivities();
  console.log('\n🎉 Testes concluídos. Verifique os logs do frontend (useInstituicaoStats) para eventos em tempo real.');
}

main().catch(err => {
  console.error('❌ Erro geral nos testes:', err);
});