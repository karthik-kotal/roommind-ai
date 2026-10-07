import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
import unittest
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_pipeline import TestPhase3APipeline

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase3APipeline)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        print("\n--- TEST FAILURES / ERRORS DETAILS ---")
        for failure in result.failures:
            print(f"FAILURE: {failure[0]}")
            print(failure[1])
        for error in result.errors:
            print(f"ERROR: {error[0]}")
            print(error[1])
        sys.exit(1)
    else:
        print("\nALL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
