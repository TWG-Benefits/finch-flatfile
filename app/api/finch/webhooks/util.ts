function calcIndividualYtdByField(individualId: string, field: string, ytdPayStatements: FinchPayStatement[], category: 'deductions' | 'contributions' | null = null): number {
    let init = 0
    ytdPayStatements.forEach(payment => {
        if (payment.code === 200) {
            const indPaycheck = payment.body?.pay_statements.find(paycheck => paycheck.individual_id == individualId)
            if (indPaycheck !== null || indPaycheck !== undefined) {
                init += findFieldAmount(indPaycheck, field, category) ?? 0
            }
        }

    })
    return init
}

function findFieldAmount(obj: any, fieldToFind: string, category: 'deductions' | 'contributions' | null = null): number | undefined {
    // Base case: If obj is not an object or is null, return undefined
    if (typeof obj !== 'object' || obj === null) {
        return undefined;
    }

    // Check for the field at the current level of the object
    if (obj.hasOwnProperty(fieldToFind)) {
        // If the field is an object with an 'amount' property, return that
        const field = obj[fieldToFind];
        if (typeof field === 'object' && field !== null && 'amount' in field && typeof field.amount === 'number') {
            return field.amount;
        }
        // Otherwise, return the field's value directly
        return typeof obj[fieldToFind] === 'number' ? obj[fieldToFind] : undefined;
    }

    // Delegate to specialized functions for deductions and contributions
    if (category === 'deductions' && obj.hasOwnProperty('employee_deductions')) {
        return sumFieldInCategory(obj['employee_deductions'], fieldToFind);
    }
    if (category === 'contributions' && obj.hasOwnProperty('employer_contributions')) {
        return sumFieldInCategory(obj['employer_contributions'], fieldToFind);
    }

    // Recursively search in nested objects
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            const result = findFieldAmount(obj[key], fieldToFind, category);
            if (result !== undefined) {
                return result;
            }
        }
    }

    // If the field is not found, return undefined
    return undefined;
}

function sumFieldInCategory(
    categoryArray: {
        name: string;
        amount: number;
        type: string | null;
        currency: string | null;
        pre_tax?: boolean | null;
    }[],
    fieldType: string): (number | undefined) {

    if (!Array.isArray(categoryArray)) {
        return undefined;
    }

    let total = 0;
    let fieldFound = false;
    categoryArray.forEach(element => {
        if (element?.type === fieldType && typeof element?.amount === 'number') {
            total += element.amount;
            fieldFound = true;
        }
    });

    return fieldFound ? total : undefined;
}

function sumAmountsForType(array: any[] | null, type: string | null): number | undefined {
    if (!array || type === null) return undefined;

    let found = false;
    const total = array.reduce((sum, element) => {
        if (element?.type === type) {
            found = true;
            return sum + (element?.amount || 0);
        }
        return sum;
    }, 0);

    return found ? total : undefined;
}

export { calcIndividualYtdByField, findFieldAmount, sumFieldInCategory, sumAmountsForType }
