import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './config';

export const seedDatabase = async (userId: string) => {
  const wsSnap = await getDocs(collection(db, 'workspaces'));
  if (!wsSnap.empty) {
    console.log("🌱 Database already has data. Skipping seed.");
    return;
  }

  console.log("🌱 Seeding initial demo data...");

  // 1. Workspace
  const wsId = 'demo-workspace-mars';
  await setDoc(doc(db, `workspaces/${wsId}`), {
    id: wsId, name: 'MARS Platform', defaultIterationDays: 14, createdAt: new Date().toISOString()
  });

  // 2. Юзер
  await setDoc(doc(db, `workspaces/${wsId}/members/${userId}`), { userId, role: 'owner', joinedAt: new Date().toISOString() });
  await setDoc(doc(db, `users/${userId}`), { lastWorkspaceId: wsId }, { merge: true });

  // 3. Teams
  const teams = [
    { id: 'team-backend', name: 'Core Backend' },
    { id: 'team-frontend', name: 'Frontend Platform' },
    { id: 'team-mobile', name: 'Mobile App' }
  ];
  for (const t of teams) {
    await setDoc(doc(db, `workspaces/${wsId}/teams/${t.id}`), t);
  }

  // 4. Roles
  const roles = [
    { id: 'role-be', name: 'Backend Engineer' },
    { id: 'role-fe', name: 'Frontend Engineer' },
    { id: 'role-qa', name: 'QA Automation' },
    { id: 'role-design', name: 'UI/UX Designer' }
  ];
  for (const r of roles) {
    await setDoc(doc(db, `workspaces/${wsId}/resourceTypes/${r.id}`), r);
  }

  // 5. People
  const people = [
    { id: 'p-1', name: 'Алексей Иванов', homeTeamId: 'team-backend', primaryResourceTypeId: 'role-be', allocations: [{ teamId: 'team-backend', percentage: 100 }] },
    { id: 'p-2', name: 'Мария Смирнова', homeTeamId: 'team-backend', primaryResourceTypeId: 'role-qa', allocations: [{ teamId: 'team-backend', percentage: 70 }, { teamId: 'team-frontend', percentage: 30 }] },
    { id: 'p-3', name: 'Илья Петров', homeTeamId: 'team-frontend', primaryResourceTypeId: 'role-fe', allocations: [{ teamId: 'team-frontend', percentage: 100 }] },
    { id: 'p-4', name: 'Анна Сидорова', homeTeamId: 'team-mobile', primaryResourceTypeId: 'role-design', allocations: [{ teamId: 'team-mobile', percentage: 100 }] },
  ];
  for (const p of people) {
    await setDoc(doc(db, `workspaces/${wsId}/people/${p.id}`), { ...p, baseCapacityPerWeek: 5 });
  }

  // 6. Calendar
  await setDoc(doc(db, `workspaces/${wsId}/absences/holiday-1`), {
    id: 'holiday-1', title: 'Новогодние праздники', personId: null, dateStart: '2026-12-31', dateEnd: '2027-01-08'
  });

  // 7. Planning Period (Q4 2026)
  const periodId = 'period-q4-2026';
  await setDoc(doc(db, `workspaces/${wsId}/periods/${periodId}`), {
    id: periodId, name: 'Q4 2026', dateStart: '2026-10-01', dateEnd: '2026-12-31'
  });

  // 8. Initiatives
  const initiatives = [
    { id: 'init-1', name: 'Переход на новый биллинг', businessValue: 'Снижение комиссии на 2%', status: 'approved', createdAt: new Date().toISOString() },
    { id: 'init-2', name: 'Редизайн онбординга', businessValue: 'Увеличение конверсии', status: 'approved', createdAt: new Date().toISOString() },
    { id: 'init-3', name: 'Внедрение AI', businessValue: 'Автоматизация саппорта', status: 'proposed', createdAt: new Date().toISOString() }
  ];
  for (const i of initiatives) {
    await setDoc(doc(db, `workspaces/${wsId}/periods/${periodId}/initiatives/${i.id}`), i);
  }

  // 9. Tasks (размазаны по Timeline)
  const tasks = [
    { 
      id: 'task-1', title: 'Интеграция Stripe API', initiativeId: 'init-1', teamId: 'team-backend', status: 'completed', 
      dateStart: '2026-10-02', dateEnd: '2026-10-10', estimates: { 'role-be': 5, 'role-qa': 2 } 
    },
    { 
      id: 'task-2', title: 'Миграция старых подписок', initiativeId: 'init-1', teamId: 'team-backend', status: 'in_progress', 
      dateStart: '2026-10-12', dateEnd: '2026-10-25', estimates: { 'role-be': 8 } 
    },
    { 
      id: 'task-3', title: 'Экран выбора тарифов', initiativeId: 'init-1', teamId: 'team-frontend', status: 'planned', 
      dateStart: '2026-10-15', dateEnd: '2026-10-28', estimates: { 'role-fe': 6, 'role-design': 1 } 
    },
    { 
      id: 'task-4', title: 'Макеты нового онбординга', initiativeId: 'init-2', teamId: 'team-mobile', status: 'in_progress', 
      dateStart: '2026-10-05', dateEnd: '2026-10-18', estimates: { 'role-design': 4 } 
    },
    { 
      id: 'task-5', title: 'Аналитика по воронке', initiativeId: 'init-2', teamId: 'team-backend', status: 'planned', 
      /* Без дат, чтобы лежало в бэклоге для тестирования протяжки */
      estimates: { 'role-be': 2 } 
    }
  ];
  
  for (const t of tasks) {
    await setDoc(doc(db, `workspaces/${wsId}/periods/${periodId}/tasks/${t.id}`), {
      ...t, createdAt: new Date().toISOString()
    });
  }

  console.log("✅ Seeding complete!");
};
