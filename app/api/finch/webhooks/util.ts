import createSFTPClient from "@/utils/sftp";




function calcIndividualYtdByField(individualId: string, field: string, ytdPayStatements: FinchPayStatement[], category: 'deductions' | 'contributions' | null = null): number {
    let init = 0
    ytdPayStatements.forEach(payment => {
        console.log(payment.payment_id)
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
    if (obj === null || obj === undefined) {
        return undefined;
    }

    // Check for the field at the current level of the object
    if (obj.hasOwnProperty(fieldToFind)) {
        // If the field is an object and has an 'amount' property, return that
        if (typeof obj[fieldToFind] === 'object' && obj[fieldToFind].hasOwnProperty('amount')) {
            return obj[fieldToFind].amount;
        }
        // Otherwise, return the field's value directly
        return obj[fieldToFind];
    }

    if (category === 'deductions' && obj.hasOwnProperty('employee_deductions')) {
        return sumFieldInDeductions(obj, fieldToFind);
    }

    if (category === 'contributions' && obj.hasOwnProperty('employer_contributions')) {
        return sumFieldInContributions(obj, fieldToFind);
    }

    // If the current level is an object, iterate through its fields
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const item = obj[key];
            if (item && typeof item === 'object') {
                const result = findFieldAmount(item, fieldToFind, category);
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }

    // If the field is not found, return undefined
    return undefined;
}

function sumFieldInDeductions(obj: any, fieldType: string): number | undefined {
    const category = 'employee_deductions'
    if (!obj || !obj[category] || !Array.isArray(obj[category])) {
        return undefined;
    }

    return sumAmountsForType(obj[category], fieldType);
}

function sumFieldInContributions(obj: any, fieldType: string): number | undefined {
    const category = 'employer_contributions'
    if (!obj || !obj[category] || !Array.isArray(obj[category])) {
        return undefined;
    }

    return sumAmountsForType(obj[category], fieldType);
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

export { calcIndividualYtdByField, findFieldAmount, sumFieldInDeductions, sumFieldInContributions, sumAmountsForType }
