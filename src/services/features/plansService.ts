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

export const plansService = {
    getCustomPlans(): Plan[] {
        try {
            const data = localStorage.getItem(CUSTOM_PLANS_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error loading custom plans:', e);
            return [];
        }
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
        try {
            const data = localStorage.getItem(ACTIVE_PLANS_KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error loading active plans:', e);
            return [];
        }
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

        const targetPlan = this.getCustomPlans().find(p => p.id === planId);
        if (!targetPlan) return 0;

        return Math.round((plan.completedDays.length / targetPlan.durationDays) * 100);
    }
};
