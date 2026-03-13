export interface PlanDayContent {
    day: number;
    title: string;
    verse: string;
    content: string;
}

export interface Plan {
    id: string;
    title: string;
    description: string;
    durationDays: number;
    category: 'standard' | 'ai' | 'thematic';
    content?: PlanDayContent[];
}

export interface UserPlan {
    planId: string;
    startDate: number;
    completedDays: number[]; // Array of day indices
}

const ACTIVE_PLANS_KEY = 'oneflow_active_plans';
const CUSTOM_PLANS_KEY = 'oneflow_custom_plans';

export const STATIC_PLANS: Plan[] = [
    {
        id: 'bible-365',
        title: 'Bíblia em 1 Ano',
        description: 'Leia a bíblia inteira de forma cronológica em 365 dias.',
        durationDays: 365,
        category: 'standard'
    },
    {
        id: 'nt-90',
        title: 'Novo Testamento em 90 Dias',
        description: 'Uma jornada intensiva pelos ensinamentos de Jesus e dos apóstolos.',
        durationDays: 90,
        category: 'standard'
    },
    {
        id: 'psalms-30',
        title: '30 Dias com Salmos',
        description: 'Encontre conforto e louvor através dos 150 salmos.',
        durationDays: 30,
        category: 'thematic'
    }
];

export const plansService = {
    getCustomPlans(): Plan[] {
        const data = localStorage.getItem(CUSTOM_PLANS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveCustomPlan(plan: Plan) {
        const customPlans = this.getCustomPlans();
        customPlans.push(plan);
        localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(customPlans));
    },

    deleteCustomPlan(planId: string) {
        // Remove from custom plans
        const customPlans = this.getCustomPlans().filter(p => p.id !== planId);
        localStorage.setItem(CUSTOM_PLANS_KEY, JSON.stringify(customPlans));
        
        // Also remove from active plans if it is there
        this.leavePlan(planId);
    },

    getActivePlans(): UserPlan[] {
        const data = localStorage.getItem(ACTIVE_PLANS_KEY);
        return data ? JSON.parse(data) : [];
    },

    joinPlan(planId: string) {
        const active = this.getActivePlans();
        if (active.some(p => p.planId === planId)) return;

        const newPlan: UserPlan = {
            planId,
            startDate: Date.now(),
            completedDays: []
        };
        active.push(newPlan);
        localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(active));
    },

    leavePlan(planId: string) {
        const active = this.getActivePlans().filter(p => p.planId !== planId);
        localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(active));
    },

    markDayComplete(planId: string, day: number) {
        const active = this.getActivePlans();
        const plan = active.find(p => p.planId === planId);
        if (plan && !plan.completedDays.includes(day)) {
            plan.completedDays.push(day);
            localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(active));
        }
    },

    getPlanProgress(planId: string): number {
        const active = this.getActivePlans();
        const plan = active.find(p => p.planId === planId);
        if (!plan) return 0;

        let targetPlan = STATIC_PLANS.find(p => p.id === planId);
        if (!targetPlan) {
            const customPlans = this.getCustomPlans();
            targetPlan = customPlans.find(p => p.id === planId);
        }

        if (!targetPlan) return 0;

        return Math.round((plan.completedDays.length / targetPlan.durationDays) * 100);
    }
};
