use std::io::Cursor;
use candid::{CandidType, Deserialize};
use serde::Serialize;
use ic_cdk::{query, update, init};
use serde_json::Value;
use std::cell::RefCell;

// Original greeting function
#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// Define data structures for contract analysis
#[derive(Clone, Debug, CandidType, Deserialize)]
struct ContractRecord {
    contract_text: String,
    label: String,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct ClauseAnalysis {
    clause: String,
    label: String,
    similarity: f64,
}

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct ContractAnalysisResult {
    total_clauses: usize,
    allowed_clauses: usize,
    not_allowed_clauses: usize,
    allowed_percentage: f64,
    not_allowed_percentage: f64,
    clause_breakdown: Vec<ClauseAnalysis>,
}

// Define data structures for advanced analysis
#[derive(Debug, Deserialize)]
struct ChatRequest {
    prompt: String,
}

#[derive(Debug, Serialize)]
struct ChatResponse {
    response: String,
}

// CSV data as embedded string
static CSV_DATA: &str = include_str!("contract_dataset_100_unique.csv");

thread_local! {
    static CONTRACT_DATASET: std::cell::RefCell<Vec<ContractRecord>> = std::cell::RefCell::new(Vec::new());
}

// Initialize the canister and load dataset
#[ic_cdk::init]
fn init() {
    ic_cdk::println!("Initializing contract analyzer with CSV dataset");
    load_contract_dataset();
}

// Function to load dataset from CSV
fn load_contract_dataset() {
    ic_cdk::println!("Loading CSV dataset...");
    ic_cdk::println!("CSV data length: {}", CSV_DATA.len());
    
    // Print first few characters to verify data
    let preview = if CSV_DATA.len() > 50 { &CSV_DATA[0..50] } else { CSV_DATA };
    ic_cdk::println!("CSV preview: {}", preview);
    
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)  // Be more flexible with CSV parsing
        .from_reader(Cursor::new(CSV_DATA));
    
    let mut records = Vec::new();
    
    for result in reader.deserialize() {
        match result {
            Ok(record) => {
                let record: ContractRecord = record;
                if !record.contract_text.is_empty() && !record.label.is_empty() {
                    records.push(record);
                }
            },
            Err(e) => {
                ic_cdk::println!("Error parsing CSV record: {}", e);
            }
        }
    }
    
    ic_cdk::println!("CSV parsing complete. Found {} records", records.len());
    
    if records.is_empty() {
        ic_cdk::println!("Warning: CSV dataset is empty, using fallback data");
        load_fallback_data();
    } else {
        ic_cdk::println!("Successfully loaded {} records from CSV dataset", records.len());
        CONTRACT_DATASET.with(|dataset| {
            *dataset.borrow_mut() = records;
        });
    }
}

// Fallback data in case CSV loading fails
fn load_fallback_data() {
    let fallback_data = vec![
        ContractRecord {
            contract_text: "The tenant shall maintain the property in good condition".to_string(),
            label: "Allowed".to_string(),
        },
        ContractRecord {
            contract_text: "The tenant shall pay a late fee of 20% for each day of delay".to_string(),
            label: "Not Allowed".to_string(),
        },
        ContractRecord {
            contract_text: "Either party may terminate this agreement with 30 days notice".to_string(),
            label: "Allowed".to_string(),
        },
        ContractRecord {
            contract_text: "The landlord may enter the premises at any time without notice".to_string(),
            label: "Not Allowed".to_string(),
        },
        ContractRecord {
            contract_text: "Rent shall be paid on the first day of each month".to_string(),
            label: "Allowed".to_string(),
        },
    ];
    
    CONTRACT_DATASET.with(|dataset| {
        *dataset.borrow_mut() = fallback_data;
    });
}

// Simple similarity function for demo purposes
fn text_similarity(text1: &str, text2: &str) -> f64 {
    let text1_lower = text1.to_lowercase();
    let text2_lower = text2.to_lowercase();
    
    let words1: Vec<&str> = text1_lower.split_whitespace().collect();
    let words2: Vec<&str> = text2_lower.split_whitespace().collect();
    
    let mut common_words = 0;
    for word in &words1 {
        if words2.contains(word) {
            common_words += 1;
        }
    }
    
    let max_words = std::cmp::max(words1.len(), words2.len());
    if max_words == 0 {
        return 0.0;
    }
    
    common_words as f64 / max_words as f64
}

// Function to classify a clause based on similarity to dataset records
fn classify_clause(clause: &str) -> (String, f64) {
    let mut max_similarity = 0.0;
    let mut best_label = "Unclassified".to_string();
    
    CONTRACT_DATASET.with(|dataset| {
        for record in dataset.borrow().iter() {
            let similarity = text_similarity(clause, &record.contract_text);
            
            if similarity > max_similarity {
                max_similarity = similarity;
                best_label = if similarity >= 0.5 {
                    record.label.clone()
                } else {
                    "Unclassified".to_string()
                };
            }
        }
    });
    
    (best_label, max_similarity)
}

// Enhanced analyzer with rule-based patterns for better classification
fn enhanced_analyze(contract_text: &str) -> Result<Vec<ClauseAnalysis>, String> {
    let clauses: Vec<&str> = contract_text
        .split(|c| c == '.' || c == '\n')
        .filter(|s| !s.trim().is_empty())
        .collect();
    
    ic_cdk::println!("Analyzing {} clauses with enhanced rules", clauses.len());
    
    let mut clause_analyses = Vec::new();
    
    for clause in clauses {
        let clause_text = clause.trim().to_string();
        if clause_text.is_empty() {
            continue;
        }
        
        let lower_clause = clause_text.to_lowercase();
        let mut score = 0.0;
        
        // Patterns suggesting unfair terms
        if lower_clause.contains("at any time") ||
           lower_clause.contains("without notice") ||
           lower_clause.contains("without consent") ||
           lower_clause.contains("without reason") ||
           lower_clause.contains("unlimited") ||
           lower_clause.contains("no obligation") ||
           lower_clause.contains("may not request") ||
           lower_clause.contains("not entitled") ||
           lower_clause.contains("not responsible") ||
           lower_clause.contains("not liable") {
            score -= 0.3;
        }
        
        // Extreme penalties or one-sided terms
        if lower_clause.contains("immediate termination") ||
           lower_clause.contains("forfeit") ||
           lower_clause.contains("waive all rights") ||
           lower_clause.contains("no refund") ||
           lower_clause.contains("20%") ||
           lower_clause.contains("25%") ||
           lower_clause.contains("30%") {
            score -= 0.3;
        }
        
        // Positive patterns suggesting fair terms
        if lower_clause.contains("right to") ||
           lower_clause.contains("entitled to") ||
           lower_clause.contains("reasonable") ||
           lower_clause.contains("mutual") ||
           lower_clause.contains("agreed") ||
           lower_clause.contains("notice") ||
           lower_clause.contains("consent") {
            score += 0.3;
        }
        
        let (base_label, base_similarity) = classify_clause(&clause_text);
        
        let mut final_similarity = base_similarity;
        let mut final_label = base_label;
        
        // If rule-based approach has a strong signal, use it
        if score <= -0.5 {
            final_label = "Not Allowed".to_string();
            final_similarity = 0.85; // Confident enough
        } else if score >= 0.5 {
            final_label = "Allowed".to_string();
            final_similarity = 0.85; // Confident enough
        } else if base_similarity < 0.6 {
            // If similarity is low but we have some rule-based signal
            if score < -0.2 {
                final_label = "Not Allowed".to_string();
                final_similarity = 0.7;
            } else if score > 0.2 {
                final_label = "Allowed".to_string();
                final_similarity = 0.7;
            }
        }
        
        clause_analyses.push(ClauseAnalysis {
            clause: clause_text,
            label: final_label,
            similarity: final_similarity,
        });
    }
    
    if clause_analyses.is_empty() {
        Err("No clauses were successfully analyzed".to_string())
    } else {
        Ok(clause_analyses)
    }
}

// Update the analyze_contract function to use our enhanced analyzer
#[ic_cdk::update]
async fn analyze_contract(contract_text: String) -> ContractAnalysisResult {
    let clauses: Vec<&str> = contract_text
        .split(|c| c == '.' || c == '\n')
        .filter(|s| !s.trim().is_empty())
        .collect();
    
    let total_clauses = clauses.len();
    
    match enhanced_analyze(&contract_text) {
        Ok(analyses) => {
            let clause_breakdown = analyses;
            let allowed_count = clause_breakdown.iter()
                .filter(|ca| ca.label == "Allowed")
                .count();
            let not_allowed_count = clause_breakdown.iter()
                .filter(|ca| ca.label == "Not Allowed")
                .count();
            
            // Calculate percentages
            let allowed_percentage = if total_clauses > 0 {
                (allowed_count as f64 / total_clauses as f64) * 100.0
            } else {
                0.0
            };
            
            let not_allowed_percentage = if total_clauses > 0 {
                (not_allowed_count as f64 / total_clauses as f64) * 100.0
            } else {
                0.0
            };
            
            ContractAnalysisResult {
                total_clauses,
                allowed_clauses: allowed_count,
                not_allowed_clauses: not_allowed_count,
                allowed_percentage,
                not_allowed_percentage,
                clause_breakdown,
            }
        },
        Err(_) => {
            // Fall back to simple similarity-based analysis
            fallback_analyze_contract(contract_text)
        }
    }
}

// Original analysis method as fallback
fn fallback_analyze_contract(contract_text: String) -> ContractAnalysisResult {
    let clauses: Vec<&str> = contract_text
        .split(|c| c == '.' || c == '\n')
        .filter(|s| !s.trim().is_empty())
        .collect();
    
    let total_clauses = clauses.len();
    
    let mut clause_breakdown = Vec::new();
    let mut allowed_count = 0;
    let mut not_allowed_count = 0;
    
    for clause in clauses {
        let clause_text = clause.trim().to_string();
        if clause_text.is_empty() {
            continue;
        }
        
        let (label, similarity) = classify_clause(&clause_text);
        
        match label.as_str() {
            "Allowed" => allowed_count += 1,
            "Not Allowed" => not_allowed_count += 1,
            _ => {}
        }
        
        clause_breakdown.push(ClauseAnalysis {
            clause: clause_text,
            label,
            similarity,
        });
    }
    
    let allowed_percentage = if total_clauses > 0 {
        (allowed_count as f64 / total_clauses as f64) * 100.0
    } else {
        0.0
    };
    
    let not_allowed_percentage = if total_clauses > 0 {
        (not_allowed_count as f64 / total_clauses as f64) * 100.0
    } else {
        0.0
    };
    
    ContractAnalysisResult {
        total_clauses,
        allowed_clauses: allowed_count,
        not_allowed_clauses: not_allowed_count,
        allowed_percentage,
        not_allowed_percentage,
        clause_breakdown,
    }
}

// Get dataset count for diagnostic purposes
#[ic_cdk::query]
fn get_dataset_size() -> usize {
    CONTRACT_DATASET.with(|dataset| {
        dataset.borrow().len()
    })
}

// Create an API endpoint for simple rule-based responses
#[ic_cdk::update]
async fn chat_with_llm(prompt: String) -> Result<String, String> {
    let prompt_lower = prompt.to_lowercase();
    
    // Simple rule-based responses without any randomness
    if prompt_lower.contains("hello") || prompt_lower.contains("hi ") {
        Ok("Hello! I'm the MyGuard contract analyzer. How can I help you with contract analysis today?".to_string())
    } else if prompt_lower.contains("contract") || prompt_lower.contains("clause") || prompt_lower.contains("agreement") {
        Ok("I can help analyze contracts for potentially unfair clauses. Please use the analyzer tool above with your full contract text.".to_string())
    } else if prompt_lower.contains("how") && (prompt_lower.contains("work") || prompt_lower.contains("analyze")) {
        Ok("I analyze contracts by comparing clauses to a dataset of known fair and unfair clauses, plus applying rules about common unfair terms.".to_string())
    } else if prompt_lower.contains("thank") {
        Ok("You're welcome! Let me know if you need more help with your contracts.".to_string())
    } else {
        Ok("I'm specialized in contract analysis. Please try the contract analyzer tool above for best results.".to_string())
    }
}

// Export the Candid interface
ic_cdk::export_candid!();
