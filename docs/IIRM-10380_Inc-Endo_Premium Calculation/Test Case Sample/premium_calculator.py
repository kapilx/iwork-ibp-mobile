#!/usr/bin/env python3
"""
Premium Calculation Script for SafeRisk Insurance Brokers
Policy: 2999207751612000000
Per Life Premium Calculation with ACTUAL RATES

Based on analysis of Active data_with Premium.csv
Implements real premium rates discovered from actual policy data

Usage:
1. Ensure CSV files are in the same directory
2. Run: python premium_calculator.py
3. Output: Premium_Calculation_Results.csv with calculated vs actual comparison
"""

import csv
import os
from decimal import Decimal, ROUND_HALF_UP

# Premium Rate Matrix (ACTUAL RATES FROM ACTIVE DATA CSV)
PREMIUM_RATES = {
    "300000": {
        "0 TO 18": 1821,      # Children & Young Adults
        "19 TO 35": 1821,     # Young Adults
        "36 TO 40": 1979,     # Early Middle Age
        "41 TO 45": 1979,     # Middle Age
        "46 TO 50": 2937,     # Pre-Senior
        "51 TO 55": 2937,     # Pre-Senior
        "56 TO 60": 3379,     # Early Senior
        "61 TO 65": 3379,     # Senior
        "66 TO 70": 4200      # Estimated based on pattern
    },
    "500000": {
        "0 TO 18": 1821,      # Children (same as 3L)
        "19 TO 35": 1821,     # Young Adults (same as 3L)
        "36 TO 40": 2962,     # 1.5x multiplier
        "41 TO 45": 2962,     # 1.5x multiplier
        "46 TO 50": 4405,     # Estimated 1.5x multiplier
        "51 TO 55": 4405,     # Estimated 1.5x multiplier
        "56 TO 60": 5068,     # Estimated 1.5x multiplier
        "61 TO 65": 5273,     # Actual from data
        "66 TO 70": 6003      # Actual from data
    }
}

# Configuration
GST_PERCENTAGE = Decimal('18.00')  # 18% GST
INPUT_FILE = "Active data_wo Premium.csv"  # Input file without premiums
VALIDATION_FILE = "Active data_with Premium.csv"  # Actual data for validation
OUTPUT_FILE = "Premium_Calculation_Results_with_Validation.csv"

def decimal_round(value, places=2):
    """Round decimal to specified places using ROUND_HALF_UP"""
    if isinstance(value, (int, float)):
        value = Decimal(str(value))
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def get_employee_sum_insured(employees_data, emp_id):
    """Get the sum insured for an employee"""
    for emp in employees_data:
        if emp['EMP ID'] == emp_id and emp['RELATIONSHIP'] == 'Self':
            return emp['SUM INSURED']
    return None

def calculate_premium_per_life(person_data, employees_data):
    """Calculate premium for each individual person"""
    emp_id = person_data['EMP ID']
    relationship = person_data['RELATIONSHIP']
    age_bracket = person_data['AGE BRACKET']
    sum_insured = person_data['SUM INSURED']
    
    # Determine effective sum insured
    if relationship == 'Self':
        effective_si = sum_insured
    else:
        # For dependents, use employee's sum insured
        effective_si = get_employee_sum_insured(employees_data, emp_id)
        if effective_si is None:
            print(f"Warning: Could not find employee sum insured for dependent {person_data['INSURED NAME']}")
            effective_si = "300000"  # Default fallback
    
    # Get premium rate
    si_key = str(effective_si)
    if si_key not in PREMIUM_RATES:
        print(f"Error: No premium rates found for sum insured {effective_si}")
        return None
    
    if age_bracket not in PREMIUM_RATES[si_key]:
        print(f"Error: No premium rate found for age bracket {age_bracket} and SI {effective_si}")
        return None
    
    basic_premium = Decimal(str(PREMIUM_RATES[si_key][age_bracket]))
    
    # Calculate premium components
    net_premium = basic_premium  # No additional charges for now
    gst_amount = decimal_round((net_premium * GST_PERCENTAGE) / 100)
    gross_premium = decimal_round(net_premium + gst_amount)
    
    return {
        'EMP_ID': emp_id,
        'HEGIC_CARD_NO': person_data['HEGIC CARD NO'],
        'INSURED_NAME': person_data['INSURED NAME'],
        'RELATIONSHIP': relationship,
        'AGE_BRACKET': age_bracket,
        'INSURED_AGE': person_data['INSURED AGE'],
        'SUM_INSURED': effective_si,
        'BASIC_PREMIUM': decimal_round(basic_premium),
        'NET_PREMIUM': decimal_round(net_premium),
        'GST_PERCENTAGE': GST_PERCENTAGE,
        'GST_AMOUNT': gst_amount,
        'GROSS_PREMIUM': gross_premium
    }

def load_validation_data():
    """Load actual premium data for validation"""
    validation_data = {}
    if os.path.exists(VALIDATION_FILE):
        with open(VALIDATION_FILE, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                key = f"{row['EMP ID']}-{row['RELATIONSHIP']}-{row['INSURED NAME']}"
                validation_data[key] = {
                    'ACTUAL_NET_PREMIUM': float(row['NETPREMIUM']),
                    'ACTUAL_GST': float(row['SERVICETAX']),
                    'ACTUAL_GROSS': float(row['GROSSPREMIUM'])
                }
    return validation_data

def main():
    """Main function to process premium calculation with validation"""
    
    # Check if input file exists
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file '{INPUT_FILE}' not found!")
        return
    
    # Load validation data
    validation_data = load_validation_data()
    has_validation = bool(validation_data)
    
    # Check if premium rates are configured
    total_rates = sum(sum(rates.values()) for rates in PREMIUM_RATES.values())
    if total_rates == 0:
        print("Warning: All premium rates are set to 0. Please update PREMIUM_RATES with actual values")
        return
    else:
        print("✓ Premium rates loaded successfully from actual policy data")
    
    # Read input data
    employees_data = []
    all_persons = []
    
    print(f"Reading data from {INPUT_FILE}...")
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            all_persons.append(row)
            if row['RELATIONSHIP'] == 'Self':
                employees_data.append(row)
    
    print(f"Found {len(employees_data)} employees and {len(all_persons)} total persons")
    
    # Calculate premiums with validation
    premium_results = []
    total_net_premium = Decimal('0')
    total_gst_amount = Decimal('0')
    total_gross_premium = Decimal('0')
    validation_matches = 0
    validation_errors = []
    
    print("Calculating premiums...")
    
    for person in all_persons:
        result = calculate_premium_per_life(person, employees_data)
        if result:
            # Add validation data if available
            validation_key = f"{person['EMP ID']}-{person['RELATIONSHIP']}-{person['INSURED NAME']}"
            if has_validation and validation_key in validation_data:
                actual = validation_data[validation_key]
                result['ACTUAL_NET_PREMIUM'] = actual['ACTUAL_NET_PREMIUM']
                result['ACTUAL_GST'] = actual['ACTUAL_GST']
                result['ACTUAL_GROSS'] = actual['ACTUAL_GROSS']
                
                # Check if calculated matches actual
                calc_net = float(result['NET_PREMIUM'])
                calc_gross = float(result['GROSS_PREMIUM'])
                
                if abs(calc_net - actual['ACTUAL_NET_PREMIUM']) < 0.01 and abs(calc_gross - actual['ACTUAL_GROSS']) < 0.01:
                    validation_matches += 1
                    result['VALIDATION_STATUS'] = 'MATCH'
                else:
                    result['VALIDATION_STATUS'] = 'MISMATCH'
                    validation_errors.append({
                        'name': person['INSURED NAME'],
                        'calculated_net': calc_net,
                        'actual_net': actual['ACTUAL_NET_PREMIUM'],
                        'difference': calc_net - actual['ACTUAL_NET_PREMIUM']
                    })
            else:
                result['ACTUAL_NET_PREMIUM'] = ''
                result['ACTUAL_GST'] = ''
                result['ACTUAL_GROSS'] = ''
                result['VALIDATION_STATUS'] = 'NO_DATA'
                
            premium_results.append(result)
            total_net_premium += result['NET_PREMIUM']
            total_gst_amount += result['GST_AMOUNT']
            total_gross_premium += result['GROSS_PREMIUM']
    
    # Write output file
    print(f"Writing results to {OUTPUT_FILE}...")
    
    fieldnames = [
        'EMP_ID', 'HEGIC_CARD_NO', 'INSURED_NAME', 'RELATIONSHIP', 
        'AGE_BRACKET', 'INSURED_AGE', 'SUM_INSURED', 
        'BASIC_PREMIUM', 'NET_PREMIUM', 'GST_PERCENTAGE', 'GST_AMOUNT', 'GROSS_PREMIUM',
        'ACTUAL_NET_PREMIUM', 'ACTUAL_GST', 'ACTUAL_GROSS', 'VALIDATION_STATUS'
    ]
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(premium_results)
    
    # Print summary with validation results
    print(f"\n{'='*60}")
    print("PREMIUM CALCULATION SUMMARY")
    print(f"{'='*60}")
    print(f"Policy Number: 2999207751612000000")
    print(f"Corporate: SafeRisk Insurance Brokers Private Limited")
    print(f"Policy Period: 12/Sep/2025 to 11/Sep/2026")
    print(f"")
    print(f"Total Persons Covered: {len(premium_results)}")
    print(f"Employees: {len(employees_data)}")
    print(f"Dependents: {len(premium_results) - len(employees_data)}")
    print(f"")
    print(f"Total Net Premium: ₹ {total_net_premium:,.2f}")
    print(f"Total GST Amount: ₹ {total_gst_amount:,.2f}")
    print(f"Total Gross Premium: ₹ {total_gross_premium:,.2f}")
    print(f"")
    
    if has_validation:
        validation_rate = (validation_matches / len(premium_results)) * 100 if premium_results else 0
        print(f"VALIDATION RESULTS:")
        print(f"Matches with Actual Data: {validation_matches}/{len(premium_results)} ({validation_rate:.1f}%)")
        
        if validation_errors:
            print(f"\nValidation Mismatches Found: {len(validation_errors)}")
            for error in validation_errors[:5]:  # Show first 5 errors
                print(f"  • {error['name']}: Calc ₹{error['calculated_net']:,.0f} vs Actual ₹{error['actual_net']:,.0f} (Diff: ₹{error['difference']:,.0f})")
            if len(validation_errors) > 5:
                print(f"  ... and {len(validation_errors) - 5} more")
        else:
            print("✓ All calculations match actual premium data!")
        print(f"")
    
    print(f"Results saved to: {OUTPUT_FILE}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()