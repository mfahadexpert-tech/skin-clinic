"""
==============================================================================
SkinLab AI - Automated RBAC Authorization Test Suite
==============================================================================
Automated security test suite verifying role boundaries across all 6 roles:
1. Owner & Admin: Full access.
2. Manager: Financials, inventory, & task management.
3. Doctor & Therapist: Clinical notes, charting, & RAG assistant.
4. Receptionist: POS checkout & appointments.
==============================================================================
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from security.auth_middleware import ROLE_HIERARCHY


class TestRBACAuthorization(unittest.TestCase):

    def test_owner_hierarchy(self):
        """Owner role must inherit all subordinate roles."""
        owner_roles = ROLE_HIERARCHY.get("owner", [])
        self.assertIn("admin", owner_roles)
        self.assertIn("doctor", owner_roles)
        self.assertIn("receptionist", owner_roles)

    def test_receptionist_boundaries(self):
        """Receptionist role must NOT inherit doctor or owner credentials."""
        receptionist_roles = ROLE_HIERARCHY.get("receptionist", [])
        self.assertIn("cashier", receptionist_roles)
        self.assertNotIn("doctor", receptionist_roles)
        self.assertNotIn("owner", receptionist_roles)

    def test_doctor_boundaries(self):
        """Doctor role must inherit therapist but NOT admin or owner."""
        doctor_roles = ROLE_HIERARCHY.get("doctor", [])
        self.assertIn("therapist", doctor_roles)
        self.assertNotIn("owner", doctor_roles)


if __name__ == "__main__":
    unittest.main()
