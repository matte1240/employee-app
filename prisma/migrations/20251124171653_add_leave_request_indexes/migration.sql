-- CreateIndex
CREATE INDEX "user_status_idx" ON "LeaveRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "status_created_idx" ON "LeaveRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "user_dates_idx" ON "LeaveRequest"("userId", "startDate", "endDate");
