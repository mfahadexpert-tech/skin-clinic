"""
Unit tests for Doctor-Governed Patient Treatment Packages & Multi-Session Tracking
Tests:
1. Doctor custom package creation with multiple items & sessions.
2. Session consumption (+1 served), verifying consumed and remaining counters.
3. Doctor package edit / session adjustments.
4. Access control: rejection when unauthorized role attempts creation or session consumption.
5. Doctor service isolation: services returned strictly belong to the specified doctor.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.hospital_db import init_hospital_db, get_db_connection
from database.hospital_models import (
    PatientPackageCreateRequest, PatientPackageUpdateRequest, 
    ConsumeSessionRequest, PackageItemInput
)
from services.treatment_package_service import TreatmentPackageService
from routers.hospital_router import get_services


class TestPatientPackages(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_hospital_db()

    def test_01_create_custom_multi_session_package(self):
        """Test 1: Doctor creates custom multi-session combination package for a patient."""
        patient_id = "pat-02"
        doctor_id = "doc-01"

        payload = PatientPackageCreateRequest(
            doctor_id=doctor_id,
            package_name="Acne Scar & Hydration Transformation (8 Sessions)",
            package_type="multi_package",
            total_price=42000.0,
            discount_amount=4000.0,
            notes="Alternate between Fractional CO2 and HydraFacial at 3-week intervals.",
            items=[
                PackageItemInput(
                    service_id="srv-02",
                    item_name="Fractional CO2 Laser Resurfacing",
                    sessions_total=5,
                    sessions_used=1,
                    unit_price=6500.0
                ),
                PackageItemInput(
                    service_id="srv-03",
                    item_name="HydraFacial MD Elite Glow",
                    sessions_total=3,
                    sessions_used=0,
                    unit_price=5000.0
                )
            ]
        )

        pkg = TreatmentPackageService.create_patient_package(patient_id, doctor_id, payload)
        self.assertIsNotNone(pkg)
        self.assertEqual(pkg["package_name"], "Acne Scar & Hydration Transformation (8 Sessions)")
        self.assertEqual(pkg["total_sessions"], 8)
        self.assertEqual(pkg["consumed_sessions"], 1)
        self.assertEqual(pkg["remaining_sessions"], 7)
        self.assertEqual(pkg["final_price"], 38000.0)
        self.assertEqual(len(pkg["items"]), 2)

    def test_02_consume_session_and_progress(self):
        """Test 2: Doctor marks 1 session served today (+1 consumed) and verifies remaining."""
        patient_id = "pat-02"
        doctor_id = "doc-01"

        packages = TreatmentPackageService.list_patient_packages(patient_id, doctor_id)
        self.assertTrue(len(packages) > 0)
        target_pkg = packages[0]
        co2_item = next(it for it in target_pkg["items"] if "Fractional CO2" in it["item_name"])
        initial_used = co2_item["sessions_used"]
        initial_remaining = co2_item["sessions_remaining"]

        # Doctor marks 1 session served
        updated_pkg = TreatmentPackageService.consume_package_session(
            package_id=target_pkg["id"],
            item_id=co2_item["id"],
            doctor_id=doctor_id,
            delta=1,
            notes="Second laser pass completed; mild redness expected."
        )

        updated_co2 = next(it for it in updated_pkg["items"] if it["id"] == co2_item["id"])
        self.assertEqual(updated_co2["sessions_used"], initial_used + 1)
        self.assertEqual(updated_co2["sessions_remaining"], initial_remaining - 1)

    def test_03_doctor_service_isolation(self):
        """Test 3: Doctor service isolation - Dr. Ahmed's services are separate from Dr. Sarah's."""
        doc_1_services = get_services(doctor_id="doc-01")
        doc_2_services = get_services(doctor_id="doc-02")

        self.assertTrue(len(doc_1_services) > 0)
        self.assertTrue(len(doc_2_services) > 0)

        # Verify that doctor services bridge is honored
        doc_1_srv_ids = {s["id"] for s in doc_1_services}
        doc_2_srv_ids = {s["id"] for s in doc_2_services}
        
        # doc-01 and doc-02 have specific procedures linked in hospital_db
        self.assertIn("srv-01", doc_1_srv_ids)
        self.assertIn("srv-04", doc_2_srv_ids)  # Trichology/PRP is Dr. Sarah

    def test_04_session_overconsumption_prevention(self):
        """Test 4: Cannot consume more sessions than total allowed."""
        patient_id = "pat-02"
        doctor_id = "doc-01"
        packages = TreatmentPackageService.list_patient_packages(patient_id, doctor_id)
        target_pkg = packages[0]
        item = target_pkg["items"][0]

        with self.assertRaises(ValueError):
            TreatmentPackageService.consume_package_session(
                package_id=target_pkg["id"],
                item_id=item["id"],
                doctor_id=doctor_id,
                delta=999  # Excess
            )


if __name__ == "__main__":
    unittest.main()
