"""Unit tests for evaluation benchmark runner and zero false-PASS verification (EVAL-01, EVAL-02, EVAL-03)."""

import pytest
from gem_api.evaluation.runner import run_benchmark, format_evaluation_report
from gem_api.evaluation.cli import main


def test_zero_false_pass_benchmark_guarantee():
    """Enforce EVAL-02: Zero false-PASS observed across all synthetic bidder cases."""
    result = run_benchmark()

    assert result.total_cases >= 20, f"Expected >= 20 cases, got {result.total_cases}"
    assert result.false_pass_count == 0, (
        f"CRITICAL: Observed {result.false_pass_count} false PASS results! "
        "Strictly 0 false PASS is required for statutory procurement safety."
    )
    assert result.false_fail_count == 0, f"Expected 0 false rejections, got {result.false_fail_count}"
    assert result.rule_precision == 1.0
    assert result.rule_recall == 1.0


def test_evaluation_performance_vs_manual_baseline():
    """Enforce EVAL-03: Process latency orders of magnitude faster than manual baseline (~18 min)."""
    result = run_benchmark()

    assert result.avg_latency_ms < 100.0, f"Expected avg latency < 100ms, got {result.avg_latency_ms}ms"
    assert result.manual_baseline_minutes == 18.0
    # Speedup factor is at least 1,000x faster than 18 mins (1,080,000 ms)
    speedup = (result.manual_baseline_minutes * 60 * 1000) / result.avg_latency_ms
    assert speedup > 1000.0


def test_evaluation_separate_metrics():
    """Enforce EVAL-01: Rule precision reported distinctly from OCR extraction accuracy."""
    result = run_benchmark()

    assert result.ocr_field_accuracy > 95.0
    assert result.rule_precision == 1.0
    assert "Zero false-PASS" in result.verdict


def test_evaluation_report_formatting():
    """Enforce markdown benchmark report formatting with complete statutory breakdown."""
    result = run_benchmark()
    report = format_evaluation_report(result)

    assert "# GeM Bid Eligibility Verification Platform — Evaluation Benchmark Report" in report
    assert "Zero False-PASS Observed:** YES (100% Guaranteed)" in report
    assert "Deterministic Rule Precision" in report
    assert "Manual Officer Review" in report
    assert "> 10,000x" in report or "ms" in report
    assert "BP-01-GOODS-COMPLIANT" in report
    assert "BP-02-GOODS-EXPIRED-CERT" in report
    assert "BP-08-GOODS-PORTAL-TIMEOUT" in report
    assert "BP-10-SERVICES-COMPLIANT" in report
    assert "BP-15-MSME-COMPLIANT-MICRO" in report


def test_evaluation_cli_exit_code(capsys):
    """Enforce CLI returns 0 on zero false-PASS benchmark success."""
    with pytest.raises(SystemExit) as exc_info:
        main()
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert "SUCCESS: Zero false-PASS observed" in captured.out


def test_deliberate_failure_injection_caught():
    """Test deliberate injection of a failing check into a passing pack and verify zero false PASS."""
    from gem_api.synthetic.bidder_packs import get_synthetic_bidder_packs
    import copy

    packs = copy.deepcopy(get_synthetic_bidder_packs())
    compliant_pack = next(p for p in packs if p["id"] == "BP-01-GOODS-COMPLIANT")
    # Corrupt the compliant pack: set local content below threshold and mark expected as FAIL
    compliant_pack["local_content_percentage"] = 12.0
    compliant_pack["expected_state"] = "FAIL"

    res = run_benchmark(packs)
    injected_detail = next(c for c in res.case_details if c.pack_id == "BP-01-GOODS-COMPLIANT")
    assert injected_detail.evaluated_state == "FAIL"
    assert injected_detail.is_correct is True
    assert res.false_pass_count == 0

