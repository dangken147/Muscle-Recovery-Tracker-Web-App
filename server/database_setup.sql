-- Bước 1: Tạo Database (Chạy lệnh này trước, hoặc nếu tạo DB bằng tay thì bỏ qua)
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AuraRecovDB')
BEGIN
    CREATE DATABASE AuraRecovDB;
END
GO

-- Bước 2: Chỉ định sử dụng Database vừa tạo
USE AuraRecovDB;
GO

-- Xoá bảng cũ nếu đã lỡ tạo để tạo lại với schema chuẩn
IF OBJECT_ID(N'[dbo].[DomsRecord]', N'U') IS NOT NULL DROP TABLE [dbo].[DomsRecord];
IF OBJECT_ID(N'[dbo].[ActivityLog]', N'U') IS NOT NULL DROP TABLE [dbo].[ActivityLog];
IF OBJECT_ID(N'[dbo].[Profile]', N'U') IS NOT NULL DROP TABLE [dbo].[Profile];
GO

-- Bước 3: Tạo bảng Profile (Hồ sơ người dùng)
CREATE TABLE [dbo].[Profile] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY, -- UUID chỉ cần 36 ký tự
    [name] NVARCHAR(255) NOT NULL,
    [age] INT NOT NULL,
    [gender] NVARCHAR(50) NOT NULL,
    [height] INT NOT NULL,
    [weight] INT NOT NULL,
    [rhr] INT NOT NULL,
    [weeklyFrequency] INT NOT NULL,
    [primarySport] NVARCHAR(100) NOT NULL,
    [oneRepMaxes] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Profile_oneRepMaxes] DEFAULT '{}',
    [injuryHistory] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_Profile_injuryHistory] DEFAULT '[]',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_Profile_createdAt] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Profile_updatedAt] DEFAULT CURRENT_TIMESTAMP
);
GO

-- Bước 4: Tạo bảng ActivityLog (Nhật ký tập luyện)
CREATE TABLE [dbo].[ActivityLog] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY, -- UUID chỉ cần 36 ký tự
    [timestamp] BIGINT NOT NULL,
    [activityType] NVARCHAR(100) NOT NULL,
    [duration] INT NOT NULL,
    [intensity] INT NOT NULL,
    [targetMuscles] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_ActivityLog_targetMuscles] DEFAULT '[]',
    [nutrition] NVARCHAR(100) NOT NULL,
    [sleep] NVARCHAR(100) NOT NULL,
    [stress] NVARCHAR(100) NOT NULL,
    [hasInjury] BIT NOT NULL CONSTRAINT [DF_ActivityLog_hasInjury] DEFAULT 0,
    [injuredMuscles] NVARCHAR(MAX) NOT NULL CONSTRAINT [DF_ActivityLog_injuredMuscles] DEFAULT '[]',
    [painScale] INT NULL,
    [notes] NVARCHAR(MAX) NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_ActivityLog_createdAt] DEFAULT CURRENT_TIMESTAMP
);
GO

-- Bước 5: Tạo bảng DomsRecord (Cảm giác đau cơ)
CREATE TABLE [dbo].[DomsRecord] (
    [id] NVARCHAR(36) NOT NULL PRIMARY KEY, -- UUID chỉ cần 36 ký tự
    [muscle] NVARCHAR(100) NOT NULL UNIQUE, -- Tên cơ bắp (vd: chest, shoulders)
    [value] INT NOT NULL,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_DomsRecord_updatedAt] DEFAULT CURRENT_TIMESTAMP
);
GO
