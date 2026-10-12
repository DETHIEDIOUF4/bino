import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class RatingScreen extends StatefulWidget {
  const RatingScreen({super.key});

  @override
  State<RatingScreen> createState() => _RatingScreenState();
}

class _RatingScreenState extends State<RatingScreen> {
  List<dynamic> _pending = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await context.read<AuthProvider>().api.get('/reviews/pending');
      setState(() => _pending = res['data'] as List);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _submit(String bookingId, int rating) async {
    try {
      await context.read<AuthProvider>().api.post('/reviews', {
        'bookingId': bookingId,
        'rating': rating,
        'comment': '',
      });
      _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Merci pour votre évaluation!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Évaluations')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _pending.isEmpty
              ? const Center(child: Text('Aucune évaluation en attente', style: TextStyle(color: AppColors.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _pending.length,
                  itemBuilder: (_, i) {
                    final b = _pending[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Comment s\'est passé votre trajet?', style: TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(5, (star) {
                                return IconButton(
                                  icon: Icon(Icons.star_rounded, color: AppColors.warning, size: 36),
                                  onPressed: () => _submit(b['_id'], star + 1),
                                );
                              }),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
