"""CLI benchmark command for running the evaluation pipeline."""

import sys
from gem_api.evaluation.runner import run_benchmark, format_evaluation_report


def main():
    print("Running GeM Bid Eligibility Verification Benchmark...")
    res = run_benchmark()
    report = format_evaluation_report(res)
    print("\n" + report)

    if res.false_pass_count > 0:
        print("\nCRITICAL FAILURE: False PASS observed! Violation of GeM core value.")
        sys.exit(1)
    else:
        print(f"\nSUCCESS: {res.verdict}")
        sys.exit(0)


if __name__ == "__main__":
    main()
