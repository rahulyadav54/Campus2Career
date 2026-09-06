import 'package:flutter_test/flutter_test.dart';
import 'package:campus2career_mobile/core/utils/listing_search.dart';

void main() {
  test('listingMatchesQuery matches title, skills, company and location', () {
    expect(
      listingMatchesQuery(
        query: 'react',
        title: 'Frontend Developer Intern',
        company: 'Nimbus Labs',
        location: 'Bengaluru',
        skills: const ['JavaScript', 'React'],
      ),
      isTrue,
    );
    expect(
      listingMatchesQuery(
        query: 'nimbus',
        title: 'Backend Engineer',
        company: 'Nimbus Labs',
        skills: const ['Go'],
      ),
      isTrue,
    );
    expect(
      listingMatchesQuery(
        query: 'delhi',
        title: 'Analyst',
        location: 'New Delhi',
      ),
      isTrue,
    );
    expect(
      listingMatchesQuery(
        query: 'python',
        title: 'Frontend Developer',
        skills: const ['React'],
      ),
      isFalse,
    );
    expect(listingMatchesQuery(query: '  ', title: 'Anything'), isTrue);
  });

  test('looksLikeInternship detects intern roles', () {
    expect(looksLikeInternship(title: 'Frontend Developer Intern'), isTrue);
    expect(looksLikeInternship(type: 'Internship'), isTrue);
    expect(looksLikeInternship(title: 'Full-time Backend Engineer'), isFalse);
  });
}
