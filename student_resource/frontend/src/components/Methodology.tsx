import React from "react";
import {
  BookOpen,
  ArrowDown,
  Layers,
  Filter,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  GitMerge,
  Sparkles,
  Zap
} from "lucide-react";

export function Methodology() {
  const pipelineStages = [
    {
      step: "01",
      name: "Data Ingestion & Memory Streaming",
      badge: "Scale: 11.6M Records",
      icon: Layers,
      color: "indigo",
      desc: "Loads raw TSV files (Source 1 reference, Sources 2 and 3 target registries) via country-partitioned streaming to guarantee minimal RAM usage (< 1.5 GB)."
    },
    {
      step: "02",
      name: "Unicode NFKD & Legal Suffix Normalization",
      badge: "O(1) Cleaners",
      icon: Sparkles,
      color: "cyan",
      desc: "Decomposes Unicode characters to standard ASCII, strips generic corporate suffixes ('Pvt Ltd', 'LLC', 'SARL', 'Inc'), expands address abbreviations ('Rd' -> 'Road', 'Ste' -> 'Suite'), and extracts building numbers and postal codes."
    },
    {
      step: "03",
      name: "Multi-Pass Inverted Blocking Index",
      badge: "Reduction: > 99.999%",
      icon: Filter,
      color: "amber",
      desc: "Eliminates 1.73 x 10¹³ Cartesian comparison explosion. Employs 4 composite keys: Country + 4-gram Prefix, Country + Significant Name Token, Country + Postal Code, and Country + Address Number with posting caps (max 100)."
    },
    {
      step: "04",
      name: "20D Vectorized Feature Engineering",
      badge: "50,000+ pairs/sec",
      icon: Cpu,
      color: "purple",
      desc: "Extracts 20 pairwise similarity signals per candidate: 2-gram/3-gram Dice coefficients, token Jaccard and containment ratios, sequence alignment, house number overlaps, postal code match, and composite similarity."
    },
    {
      step: "05",
      name: "HistGradientBoosting Classifier",
      badge: "1:3 Hard Negative Ratio",
      icon: GitMerge,
      color: "emerald",
      desc: "Trained on leak-free group-split S1 entities with controlled hard-negative candidate sampling. Fast binned histograms enable rapid convergence and robust probability calibration."
    },
    {
      step: "06",
      name: "Macro F0.5 Threshold Calibration",
      badge: "Optimal τ = 0.88",
      icon: ShieldCheck,
      color: "cyan",
      desc: "Exhaustive grid sweep over validation probabilities selecting the threshold (0.88) that optimizes the official macro-averaged F0.5 metric, heavily penalizing false merges while giving full 1.0 credit to singletons."
    },
    {
      step: "07",
      name: "Final Output & Submission Validator",
      badge: "100% Compliant",
      icon: FileCheck2,
      color: "emerald",
      desc: "Generates matching_results.tsv and candidate_pairs.tsv. Automatically verified by utils/validate_submission.py for strict leaderboard submission compliance."
    }
  ];

  const faqs = [
    {
      q: "Why is blocking essential for entity resolution?",
      a: "Comparing 1.73M reference entities against 9.96M target records without blocking would require 1.73 x 10¹³ pairwise comparisons—an intractable workload. Multi-pass inverted blocking narrows this space down to high-precision candidates in seconds without dropping true matches."
    },
    {
      q: "Why 20 similarity features instead of just Levenshtein distance?",
      a: "Business entities have diverse noise modes: name abbreviations, co-located commercial addresses, shared street numbers, and transliterations. Character n-grams catch typos, token set ratios handle corporate suffixes, and numeric overlaps confirm physical addresses."
    },
    {
      q: "Why optimize specifically for Macro F0.5?",
      a: "Macro F0.5 weights precision 2x over recall. In enterprise master data management, falsely merging two distinct legal businesses creates massive liability and contamination. High thresholds (τ = 0.88) ensure only verified matches are merged."
    },
    {
      q: "How are singleton (unmatched) entities handled?",
      a: "When a reference entity has no candidates exceeding the 0.88 threshold, it is output with an empty match list. In competition scoring, correctly identified singletons receive a perfect 1.0 score, while false merges on singletons yield 0.0."
    },
    {
      q: "How does the pipeline generalize to open-set countries like France?",
      a: "Country is treated as a dynamic open-set string token for index partitioning and feature extraction, completely avoiding hardcoded country schemas."
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2 font-mono-code">
          <BookOpen className="w-3.5 h-3.5" />
          Technical Architecture & AI Workflow
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight font-display">System Methodology & ML Pipeline</h2>
        <p className="text-xs text-slate-400 mt-1">
          End-to-end multi-pass blocking, pairwise feature extraction, and precision-optimized gradient boosted entity linkage.
        </p>
      </div>

      {/* Pipeline Flowchart Visual */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
          End-to-End Pipeline Execution Flow
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-cyan-500 before:to-emerald-500">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div key={idx} className="relative group">
                {/* Node circle */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-[#0F172A] border-2 border-indigo-500 flex items-center justify-center shadow-md">
                  <span className="text-[10px] font-bold font-mono-code text-indigo-300">{stage.step}</span>
                </div>

                <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-base font-bold text-white font-display">{stage.name}</h4>
                    </div>
                    <span className="text-xs font-mono-code px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-semibold w-fit">
                      {stage.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-1 sm:pl-10">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical FAQs & Deep-Dives */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
          Key Design Decisions & Technical FAQs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-[#111827] rounded-xl p-5 border border-slate-800 space-y-2">
              <div className="flex items-start gap-2 text-indigo-300 font-semibold text-xs">
                <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <h4 className="font-display text-white text-sm">{faq.q}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
