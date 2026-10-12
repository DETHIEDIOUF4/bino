import 'package:flutter_test/flutter_test.dart';
import 'package:aidafall/main.dart';

void main() {
  testWidgets('App loads splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const AidaFallApp());
    expect(find.text('AidaFALL'), findsOneWidget);
  });
}
