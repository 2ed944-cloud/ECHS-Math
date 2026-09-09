"""Negative tests for misleading completion, lost dependencies and source drift."""
import copy
from pathlib import Path
import unittest
from unittest.mock import patch
from validate_master_execution_plan import load, validate, safe_path

class MasterExecutionPlanTests(unittest.TestCase):
    def setUp(self):self.plan=copy.deepcopy(load())
    def row(self,id):return next(t for t in self.plan['tasks'] if t['id']==id)
    def rejected(self,fragment):self.assertTrue(any(fragment in e for e in validate(self.plan)),validate(self.plan))
    def test_current_snapshot(self):self.assertEqual(validate(self.plan),[])
    def test_current_release_without_future_candidate_files(self):
        # Concurrent local C02 work must not make this C01 board claim those
        # paths already ship in production, including references in other tasks.
        future = {'supabase/functions/_shared','supabase/functions/_shared/mastery-status.mjs','js/learning-evidence-status.mjs','tools/test_mastery_read_models.mjs'}
        original = Path.exists
        def in_release(path):
            if any(path.as_posix().endswith('/' + name) for name in future):return False
            return original(path)
        with patch.object(Path, 'exists', in_release):
            self.assertEqual(validate(self.plan),[])
    def test_duplicate_task(self):self.plan['tasks'].append(copy.deepcopy(self.plan['tasks'][0]));self.rejected('duplicate task')
    def test_missing_dependency(self):self.row('ECHS-C01')['depends_on'].append('ECHS-999');self.rejected('unknown/self')
    def test_cycle(self):self.row('ECHS-C00')['depends_on']=['ECHS-C01'];self.rejected('cycle')
    def test_final_gate_cannot_omit_assessment_studio(self):self.row('ECHS-062')['depends_on'].remove('ECHS-028');self.rejected('final acceptance omits')
    def test_false_verified(self):self.row('ECHS-C02')['status']='VERIFIED';self.rejected('verified deployment required')
    def test_code_is_not_tested(self):
        self.row('ECHS-C01')['tests']={'status':'NOT_RUN','evidence':[]}
        self.row('ECHS-C01')['status']='TESTED';self.rejected('passing tests')
    def test_latest_release_matches_verified_revision(self):
        self.plan['last_verified_release']['main_sha']='0'*40;self.rejected('latest release revision')
    def test_latest_release_requires_evidence(self):
        self.plan['last_verified_release']['evidence']='docs/codex/not-a-receipt.json';self.rejected('latest release evidence')
    def test_latest_release_cannot_claim_unverified_task(self):
        self.plan['last_verified_release']['task']='ECHS-C09';self.rejected('latest release task')
    def test_passing_claim_without_evidence(self):self.row('ECHS-014')['tests']['evidence']=[];self.rejected('need evidence')
    def test_missing_deployed_revision(self):self.row('ECHS-014')['deployment']['verified_at_main']='local';self.rejected('verified revision')
    def test_unknown_component_task(self):self.plan['component_families'][0]['tasks']=['ECHS-999'];self.rejected('family task mapping')
    def test_missing_component(self):self.plan['component_families'].pop();self.rejected('26 component')
    def test_false_family_verification(self):self.plan['component_families'][0]['status']='VERIFIED';self.rejected('unverified component')
    def test_lost_charter_section(self):self.plan['charter_coverage'].pop();self.rejected('coverage incomplete')
    def test_invented_section_53(self):self.row('ECHS-C00')['charter_sections'].append(53);self.rejected('invented charter')
    def test_changed_charter_source(self):self.plan['charter']['sha256']='0'*64;self.rejected('charter hash')
    def test_incorrect_source_count(self):self.plan['production_baseline']['source_files_verified']=1;self.rejected('baseline count')
    def test_local_head_cannot_claim_production(self):self.plan['production_baseline']['local_git_head_is_production_evidence']=True;self.rejected('not deployed')
    def test_path_traversal(self):self.row('ECHS-C01')['implementation_location'][0]['path']='../private';self.rejected('unsafe implementation')
    def test_absolute_private_path(self):self.plan['charter']['path']='C:/Users/name/private';self.rejected('unsafe')
    def test_misleading_overall_completion(self):self.plan['whole_program_complete']=True;self.rejected('unverified tasks')
    def test_unknown_risk_owner(self):self.plan['unresolved_risks'][0]['owner_task']='ECHS-999';self.rejected('risk owner')
    def test_safe_paths(self):
        for p in ['/tmp/x','C:/private','../x','a/../x','a\\b','a//b','./a']:
            self.assertFalse(safe_path(p),p)
        self.assertTrue(safe_path('docs/codex/MASTER_EXECUTION_PLAN.json'))

if __name__=='__main__':unittest.main(verbosity=2)
