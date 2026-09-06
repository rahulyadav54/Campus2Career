import 'package:flutter_test/flutter_test.dart';
import 'package:campus2career_mobile/models/job.dart';

void main() {
  test('Job.fromJson reads live Render job shape', () {
    final job = Job.fromJson({
      '_id': 'abc',
      'title': 'Nimbus Labs — Frontend Developer Intern',
      'description': 'Build UIs',
      'location': 'Bengaluru',
      'stipend': '₹22,000/month',
      'skillsRequired': ['JavaScript', 'React'],
      'recruiter': {'name': 'Nimbus Talent', 'company': 'Nimbus Labs', 'email': 'hr@x.com'},
      'isActive': true,
      'status': 'approved',
    });
    expect(job.id, 'abc');
    expect(job.companyName, 'Nimbus Labs');
    expect(job.stipend, '₹22,000/month');
    expect(job.requiredSkills, ['JavaScript', 'React']);
  });
}
