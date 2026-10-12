import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../services/location_service.dart';
import '../services/places_service.dart';

class AddressSearchField extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final LocationPoint? initial;
  final ValueChanged<LocationPoint?> onChanged;
  final VoidCallback? onMapTap;

  const AddressSearchField({
    super.key,
    required this.label,
    required this.icon,
    required this.iconColor,
    this.initial,
    required this.onChanged,
    this.onMapTap,
  });

  @override
  State<AddressSearchField> createState() => _AddressSearchFieldState();
}

class _AddressSearchFieldState extends State<AddressSearchField> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  List<PlaceSuggestion> _suggestions = [];
  bool _loading = false;
  bool _showSuggestions = false;
  Timer? _debounce;
  LocationPoint? _selected;

  @override
  void initState() {
    super.initState();
    if (widget.initial != null) {
      _selected = widget.initial;
      _controller.text = widget.initial!.label;
    }
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) {
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) setState(() => _showSuggestions = false);
        });
      }
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged(String value) {
    _debounce?.cancel();
    if (value.isEmpty) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
        _selected = null;
      });
      widget.onChanged(null);
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 350), () async {
      setState(() => _loading = true);
      final results = await PlacesService.search(value);
      if (mounted) {
        setState(() {
          _suggestions = results;
          _showSuggestions = results.isNotEmpty && _focusNode.hasFocus;
          _loading = false;
        });
      }
    });
  }

  Future<void> _selectSuggestion(PlaceSuggestion suggestion) async {
    setState(() {
      _loading = true;
      _showSuggestions = false;
      _controller.text = suggestion.description;
    });
    _focusNode.unfocus();

    final point = await PlacesService.getPlaceDetails(suggestion.placeId);
    if (!mounted) return;

    if (point != null) {
      setState(() {
        _selected = point;
        _controller.text = point.label;
        _loading = false;
      });
      widget.onChanged(point);
    } else {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible de récupérer cette adresse')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: _focusNode.hasFocus ? AppColors.primary : const Color(0xFFE2E8F0),
              width: _focusNode.hasFocus ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 14),
                child: Icon(widget.icon, color: widget.iconColor, size: 22),
              ),
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  onChanged: _onTextChanged,
                  onTap: () {
                    if (_suggestions.isNotEmpty) setState(() => _showSuggestions = true);
                  },
                  decoration: InputDecoration(
                    hintText: 'Rechercher ${widget.label.toLowerCase()}...',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    suffixIcon: _loading
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                          )
                        : _controller.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: () {
                                  _controller.clear();
                                  _onTextChanged('');
                                },
                              )
                            : null,
                  ),
                ),
              ),
              if (widget.onMapTap != null)
                IconButton(
                  icon: const Icon(Icons.map_outlined, color: AppColors.textMuted),
                  tooltip: 'Choisir sur la carte',
                  onPressed: widget.onMapTap,
                ),
            ],
          ),
        ),

        if (_showSuggestions && _suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: 6),
              itemCount: _suggestions.length,
              separatorBuilder: (_, i) => const Divider(height: 1, indent: 48),
              itemBuilder: (_, i) {
                final s = _suggestions[i];
                return ListTile(
                  dense: true,
                  leading: Icon(Icons.place_outlined, color: widget.iconColor, size: 22),
                  title: Text(s.mainText, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  subtitle: s.secondaryText.isNotEmpty
                      ? Text(s.secondaryText, style: const TextStyle(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)
                      : null,
                  onTap: () => _selectSuggestion(s),
                );
              },
            ),
          ),

        if (_selected != null && !_showSuggestions)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: AppColors.primary, size: 14),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _selected!.label,
                    style: const TextStyle(fontSize: 12, color: AppColors.primary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
