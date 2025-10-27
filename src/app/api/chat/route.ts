if (userId !== req.user.id) {
  return NextResponse.json(
    { error: 'Unauthorized' }, { status: 401 }
  );
}
