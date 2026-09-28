"""CLI runner for the 3-minute hackathon demonstration walkthrough (DEMO-01)."""

import sys
from gem_api.demo.walkthrough import run_demo_walkthrough


def main():
    print("Initializing 3-Minute Hackathon Demonstration Walkthrough...")
    results = run_demo_walkthrough(verbose=True)
    all_passed = all(r.status == "PASSED" for r in results)
    if all_passed:
        print("\nAll 6 demo milestones successfully verified.")
        sys.exit(0)
    else:
        print("\nDemo walkthrough encountered failures!")
        sys.exit(1)


if __name__ == "__main__":
    main()
